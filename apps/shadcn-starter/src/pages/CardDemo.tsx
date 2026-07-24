import { Badge } from '../recipes/Badge/Badge.tsx';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../recipes/Card/Card.tsx';

export function CardDemo() {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Card</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-(--text-muted)">Footer</p>
          </CardFooter>
        </Card>
        {/* Third column proves the header grid promotes only when CardAction is present */}
        <Card>
          <CardHeader>
            <CardTitle>With action</CardTitle>
            <CardDescription>Header promotes to two columns</CardDescription>
            <CardAction>
              <Badge intent="neutral" variant="outline">
                New
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>The action sits top-right, spanning both header rows.</p>
          </CardContent>
        </Card>
        {/* Second card for visual comparison: className override, no footer */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Customized</CardTitle>
            <CardDescription>With className override</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Dashed border via className.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
