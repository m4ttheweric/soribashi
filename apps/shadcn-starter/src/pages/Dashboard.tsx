import { Button } from '../recipes/Button/Button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../recipes/Card/Card.tsx';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';

/** Placeholder metrics; Phase 4 wires these to real data via Chart/Sidebar. */
const METRICS = ['Revenue', 'Users', 'Sales', 'Active'];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard (stub)</h2>
        <Button size="sm">Refresh</Button>
      </div>
      <p className="text-sm text-(--text-muted)">
        Reaches donor-complete parity after Phase 4 (Chart, Sidebar). Currently shows
        converted-subset content.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-2xl">$0.00</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-(--text-muted)">Placeholder data</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Chart placeholder (Phase 4)</p>
            </CardContent>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Table placeholder (Phase 2)</p>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs>
    </div>
  );
}
