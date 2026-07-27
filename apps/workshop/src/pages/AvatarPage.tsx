import { Avatar, uiVocabulary } from '@soribashi/ui';

const SIZES = uiVocabulary.size.values;

/** A small inline SVG "person" glyph, so the loaded-image state needs no network round trip. */
const SAMPLE_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNGM2ZWY1Ii8+CiAgPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTIiIGZpbGw9IiNmZmZmZmYiLz4KICA8cGF0aCBkPSJNOCA2MGMwLTE0IDEwLTIyIDI0LTIyczI0IDggMjQgMjIiIGZpbGw9IiNmZmZmZmYiLz4KPC9zdmc+Cg==';

export function AvatarPage() {
  return (
    <div>
      <h1>Avatar</h1>
      <p>Sizes (fallback), plus the image and fallback states side by side.</p>

      <h2>Sizes (fallback)</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {SIZES.map((size) => (
          <Avatar key={size} size={size} fallback={size.toUpperCase()} />
        ))}
      </div>

      <h2>Image and fallback</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Avatar fallback="AB" />
        <Avatar src={SAMPLE_IMAGE} alt="Sample user" fallback="CD" />
      </div>
    </div>
  );
}
