import { useQuery } from "@tanstack/react-query";
import { getPackageDependencies } from "@/utils/packageDependencies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PackageDependencies() {
  const { data: dependencies, isLoading, error } = useQuery({
    queryKey: ['packageDependencies'],
    queryFn: getPackageDependencies
  });

  if (isLoading) {
    return <div>Loading dependencies...</div>;
  }

  if (error) {
    return <div>Error loading dependencies: {(error as Error).message}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Package Dependencies</CardTitle>
        <CardDescription>
          Manage package versions and resolve conflicts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Required By</TableHead>
              <TableHead>Conflicts</TableHead>
              <TableHead>Resolution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dependencies?.map((dep) => (
              <TableRow key={dep.id}>
                <TableCell className="font-medium">{dep.package_name}</TableCell>
                <TableCell>{dep.current_version}</TableCell>
                <TableCell>
                  {dep.required_by.map((pkg) => (
                    <Badge key={pkg} variant="secondary" className="mr-1">
                      {pkg}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  {Object.entries(dep.conflicts_with).map(([pkg, version]) => (
                    <Badge key={pkg} variant="destructive" className="mr-1">
                      {pkg}@{version}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>{dep.resolution_strategy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}