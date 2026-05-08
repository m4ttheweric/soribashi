# Harness Engineering — Distilled Learnings for Soribashi

**Source:** [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) — Ryan Lopopolo, OpenAI, 2026-02-11.
**Captured:** 2026-05-08, on `wave-2-tooltip-pilot`.
**Why this doc exists:** Soribashi is built almost entirely with agent-driven workflows (superpowers, wave-based pilots, doc-as-system-of-record). The OpenAI post is the most concrete public account of running a fully agent-generated codebase. Where their lessons map cleanly to our setup, we should steal them. Where they don't, we should know why.

---

## The thesis in one paragraph

OpenAI built a million-line internal product over five months with **0 lines of human-written code** — every line (app, tests, CI, docs, dashboards, internal tools) written by Codex. ~1,500 PRs, 7 engineers (started at 3), ~3.5 PRs/engineer/day. The job of the engineer changed from "write code" to **"design environments, specify intent, and build feedback loops that let agents do reliable work."** They call this *harness engineering*: building the harness around the agent so the agent's work compounds instead of decays.

The headline reframe: **humans steer, agents execute.** The scarce resource is human time and attention — everything in the harness exists to amortize it.

---

## The ten lessons that map to Soribashi

### 1. Treat AGENTS.md (or CLAUDE.md) as a table of contents, not an encyclopedia

OpenAI tried "one big AGENTS.md" and it failed in four predictable ways:

- **Context is scarce.** A giant file crowds out the task, the code, and the relevant docs.
- **Too much guidance becomes non-guidance.** When everything is "important," nothing is.
- **It rots instantly.** A monolithic manual becomes a graveyard of stale rules.
- **It can't be verified.** A blob doesn't lend itself to coverage / freshness / cross-link checks.

Their fix: a **~100-line AGENTS.md** that's a *map*, with pointers to deeper sources of truth in `docs/`.

**For Soribashi:** we don't have a top-level `CLAUDE.md` or `AGENTS.md` yet. As the repo grows past Wave 2, the right move is a short top-level map that points into `docs/superpowers/{sessions, specs, plans, pilots, audits, reviews, roadmap, divergences}` — not a long-form rulebook.

---

### 2. Repository knowledge is the system of record. If it isn't in the repo, it doesn't exist.

Their phrasing: *"Anything the agent can't access in-context while running effectively doesn't exist. Knowledge that lives in Google Docs, chat threads, or people's heads are not accessible to the system."*

They explicitly push Slack alignment, design conversations, and onboarding context **into the repo as versioned markdown** so future agent runs can find it.

**For Soribashi:** this is what `docs/superpowers/` already is — pilot journals, design specs, plan files, divergences from Mantine, audit tier sweeps. The discipline to keep doing: **when a decision is made in chat or in conversation, land it as a doc commit, not a memory note.** Memory in `~/.claude/.../memory/` is for *agent-instance* context (user prefs, session handoffs); the repo is for *project* truth.

Reinforcing constraint already in our memory: *"don't branch for small doc-only additions"* — commit doc-only updates straight to main. That removes the friction that would otherwise keep knowledge out of the repo.

---

### 3. Plans and execution journals are first-class artifacts

OpenAI keeps `docs/exec-plans/` with `active/`, `completed/`, and `tech-debt-tracker.md`. Lightweight ephemeral plans for small changes; full execution plans (with progress and decision logs) for complex work — all checked in.

**For Soribashi:** we already do this in `docs/superpowers/plans/` and `docs/superpowers/pilots/`. The piece worth borrowing explicitly: **a `tech-debt-tracker.md`** that lists known debt and is consulted at planning time. We track tier-1 audits, but a single rolling debt ledger keyed by package would compound better than scanning audits each wave.

---

### 4. Make the application directly legible to the agent (UI, logs, metrics)

Their concrete moves:

- App **boots per git worktree** so each agent run drives an isolated instance.
- **Chrome DevTools Protocol** wired into the agent runtime; skills for DOM snapshots, screenshots, navigation.
- **Logs and metrics ephemeral per worktree** via a local observability stack (LogQL, PromQL).

Result: prompts like *"ensure service startup completes in under 800ms"* or *"no span in these four critical user journeys exceeds two seconds"* become tractable. Single agent runs work for **upwards of six hours** while humans sleep.

**For Soribashi:** we have Playwright + vitest + a per-app dev server, and the `apps/core-radix-pilot/` already runs on its own port. The applicable upgrades:

- **Per-worktree dev server / port allocation** so parallel agent sessions don't collide.
- A **screenshot/DOM-snapshot skill** wired into the agent loop for pilot apps — not just `playwright test` but a "show me the rendered Button matrix and tell me what looks off" loop.
- **Quality-score telemetry** (visual diff vs. Mantine reference) emitted to a file the agent can read, not just a CI artifact.

This is the highest-leverage harness investment for a UI-library project — **agents that can *see* the rendered output unlock the same kind of long autonomous runs OpenAI describes.**

---

### 5. Enforce architectural invariants mechanically. Lint error messages teach the agent.

OpenAI's architecture: **fixed layers per business domain** (Types → Config → Repo → Service → Runtime → UI), strictly validated dependency directions, cross-cutting concerns (auth, telemetry, feature flags) only through a `Providers` interface. Custom linters and structural tests enforce the rule. Quote: *"This is the kind of architecture you usually postpone until you have hundreds of engineers. With coding agents, it's an early prerequisite: the constraints are what allows speed without decay or architectural drift."*

Killer detail: **custom lints inject remediation instructions into the error message** so the agent gets the fix path inline. *"In a human-first workflow, these rules might feel pedantic or constraining. With agents, they become multipliers."*

**For Soribashi:** we already have a strong layer model — `packages/core` (primitives) → `packages/factory` (CVI engine, polymorphic helpers) → `packages/codegen` → consumer apps. The applicable moves:

- Encode **dependency-direction invariants** as biome / custom lints (e.g., `factory` must not import from `apps/*`; `core` must not import from `factory`).
- Add **taste invariants** as lints: structured logging, file-size limits, naming conventions for recipes / variants / tokens.
- **Write the lint error messages for the agent**, not for a human — include the fix recipe, the doc link, and the *why*. Treat the lint message as a tiny prompt fragment that lands in agent context whenever the rule fires.

This is probably our single biggest "free lunch" — the architecture is already disciplined; we just need to make the rules mechanical so agents can't drift past them.

---

### 6. Boring, composable, well-represented dependencies beat clever ones

*"Technologies often described as 'boring' tend to be easier for agents to model due to composability, API stability, and representation in the training set. In some cases, it was cheaper to have the agent reimplement subsets of functionality than to work around opaque upstream behavior from public libraries."*

Their example: instead of `p-limit`, they had Codex implement a custom map-with-concurrency helper that's tightly integrated with their OpenTelemetry instrumentation, has 100% test coverage, and behaves exactly the way their runtime expects.

**For Soribashi:** we're already doing this with the factory transcription from Mantine — **internalize the abstraction, control the surface area, give the agent something it can fully reason about.** The reinforcing principle: when evaluating a new dependency, ask "is this more legible than the 50–200 lines we'd write ourselves?" If the dependency is opaque or has surprising behavior, the bespoke version often wins for an agent-driven codebase even when it would lose for a human-driven one.

---

### 7. Agent legibility, not human stylistic preference, is the bar

*"The resulting code does not always match human stylistic preferences, and that's okay. As long as the output is correct, maintainable, and legible to future agent runs, it meets the bar."*

This is a real reframe. **Aesthetic nitpicks that don't affect correctness, maintainability, or future agent legibility are noise.** Reserve human taste for: invariants, boundaries, naming that informs reasoning, the shape of the public API.

**For Soribashi:** during PR review (especially the Wave 2 pilots), the bar should be:

1. Does the code preserve the architectural invariant?
2. Will the next agent run be able to read and extend it?
3. Does the public surface match the design system contract?

If yes to all three, ship it. Don't burn human attention on rewriting an idiomatic-but-not-mine helper.

---

### 8. Encode "golden principles" + recurring garbage-collection runs

OpenAI used to spend **every Friday (20% of the week) cleaning up "AI slop."** That didn't scale. They replaced it with:

- **Golden principles** encoded mechanically (e.g., "prefer shared utility packages over hand-rolled helpers"; "no YOLO data probing — validate at boundaries or use typed SDKs").
- **Background Codex tasks on a regular cadence** that scan for deviations, update quality grades, and open targeted refactor PRs. Most reviewable in under a minute and auto-merged.

Framing: *"Technical debt is like a high-interest loan: it's almost always better to pay it down continuously in small increments than to let it compound and tackle it in painful bursts."*

**For Soribashi:** the audit sweeps in `docs/superpowers/audits/` are already a manual version of this. The upgrade is to make them **scheduled and agent-driven**, with a `golden-principles.md` checked in and a recurring task (literally: a `loop` skill or a scheduled agent) that runs the audit, flags drift, and opens cleanup PRs. Wave-end is too coarse a cadence; daily / per-PR cleanup keeps the wave-2-tooltip-pilot from accumulating the kind of cross-slot leak / dark cascade bugs we just fixed in #1eb4fc4 / #0bae6db.

---

### 9. Throughput changes the merge philosophy

*"In a system where agent throughput far exceeds human attention, corrections are cheap, and waiting is expensive."* OpenAI runs minimal blocking merge gates, short-lived PRs, and addresses test flakes with re-runs rather than blocking indefinitely.

**For Soribashi:** we're not yet at OpenAI's PR/day rate, but the principle scales down. The applicable lesson: **don't reflexively gate on every nice-to-have lint.** Gate on the architectural invariants (the things that, if broken, are expensive to undo); let style / taste corrections land as follow-up sweeps. The Wave 1 PR was 47 commits — that's the right shape for an agent-driven branch. The wrong shape is a Wave 1 PR that sat for two weeks waiting for a human to nitpick a variant name.

This is *not* permission to skip type checks or merge red CI. It's permission to not invent gates that exist mainly to soothe human anxiety.

---

### 10. End-state: single-prompt feature loop

Their stated end state — the bar agents can hit *given the right harness*:

> Given a single prompt, the agent can now: validate the current state of the codebase → reproduce a reported bug → record a video demonstrating the failure → implement a fix → validate the fix by driving the application → record a second video demonstrating the resolution → open a pull request → respond to agent and human feedback → detect and remediate build failures → escalate to a human only when judgment is required → merge the change.

*"This behavior depends heavily on the specific structure and tooling of this repository and should not be assumed to generalize without similar investment — at least, not yet."*

**For Soribashi:** this is a useful north-star for the harness around `apps/core-radix-pilot/`. Not a Q3 deliverable, but the right shape to bias *every* harness investment toward. Each new skill (`/ce-test-browser`, `/ce-demo-reel`, `/ce-resolve-pr-feedback`) should be evaluated on whether it moves the needle toward "single prompt → merged PR with video evidence."

---

## What Soribashi already does well (per harness-engineering's framing)

- **Repo-as-system-of-record** — `docs/superpowers/` is structurally what they describe.
- **Plans + pilot journals as first-class artifacts** — `plans/`, `pilots/`, `specs/`, `sessions/` already split.
- **Tier audits** as a quality grading mechanism — close cousin to their `QUALITY_SCORE.md`.
- **Strict layering across packages** (`core` / `factory` / `codegen` / consumer apps).
- **Memory file separation** — agent-session context vs. project truth, with the explicit rule against branching for doc-only changes.

## What's missing from our harness (highest leverage first)

1. **Mechanical enforcement of layering rules** as custom lints with agent-targeted error messages (lesson 5).
2. **Per-worktree dev server + screenshot skill** for the pilot apps so agents can see what they ship (lesson 4).
3. **Top-level `CLAUDE.md` / `AGENTS.md` as a 100-line map** pointing into `docs/superpowers/` (lesson 1).
4. **Scheduled garbage-collection agent** + `golden-principles.md` instead of wave-end audit sweeps (lesson 8).
5. **`docs/superpowers/tech-debt-tracker.md`** — a single rolling ledger consulted at plan time (lesson 3).

## Things from the article that *don't* directly apply (and why)

- **0 lines of human-written code as a constraint.** OpenAI took this on as an experiment to force harness investment. Soribashi has working code already, including the factory transcription. The applicable lesson is the *direction* (push more code through agent loops, harden the harness) — not the *purity* (no human keystrokes).
- **Million-line monorepo throughput.** Their merge philosophy ("don't block on flakes") is calibrated for ~3.5 PRs/eng/day. We're slower; some of their gate-removals would be premature for our throughput.
- **Custom observability stack per worktree.** Soribashi is a UI library, not a service. The analog is visual / DOM observability (lesson 4), not LogQL/PromQL.

---

## Suggested follow-ups

These are scoped as separate, doc-only or small-PR pieces — pick one per session:

1. **Draft a top-level `CLAUDE.md`** as a 100-line map (lesson 1). Doc-only, commit straight to main.
2. **Write `docs/superpowers/golden-principles.md`** capturing the invariants we already enforce informally (lesson 8). Doc-only.
3. **Spec a `docs/superpowers/tech-debt-tracker.md`** schema, port known debt from existing audits (lesson 3). Doc-only.
4. **Plan: layer-enforcement lints** — what biome rules + custom lints would catch the dependency-direction violations? Plan-doc, then a wave-scoped PR (lesson 5).
5. **Plan: per-worktree pilot-app port allocation + screenshot skill** for `core-radix-pilot/` (lesson 4). Plan-doc, then a wave-scoped PR.

Each of these is 1–2 sessions of work and compounds. None of them require touching `packages/` source.
