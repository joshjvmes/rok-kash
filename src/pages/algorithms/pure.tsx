import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Pure() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pure Algorithm</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This feature is coming soon.
        </p>
      </CardContent>
    </Card>
  );
}