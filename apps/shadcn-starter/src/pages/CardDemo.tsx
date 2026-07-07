import {
  Card,
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
