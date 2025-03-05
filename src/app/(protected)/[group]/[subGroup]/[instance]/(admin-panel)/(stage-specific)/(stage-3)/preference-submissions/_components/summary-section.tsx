import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

type TempData = {
  all: number;
  submitted: number;
  incomplete: number;
  preAllocated: number;
};

export function SummarySection({ data }: { data: TempData }) {
  return (
    <Card className="w-full max-w-96">
      <CardContent className="pt-6">
        <Table>
          <TableBody>
            <TableRow className="flex items-center justify-between">
              <TableCell className="text-base font-medium">Submitted</TableCell>
              <TableCell>
                <Badge
                  className="min-w-10 rounded-full text-center"
                  variant="accent"
                >
                  <p className="w-full">{data.submitted}</p>
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow className="flex items-center justify-between">
              <TableCell className="text-base font-medium">
                Not Submitted
              </TableCell>
              <TableCell>
                <Badge
                  className="min-w-10 rounded-full text-center"
                  variant="accent"
                >
                  <p className="w-full">{data.incomplete}</p>
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow className="flex items-center justify-between">
              <TableCell className="text-base font-medium">
                Pre-allocated
              </TableCell>
              <TableCell>
                <Badge
                  className="min-w-10 rounded-full text-center"
                  variant="accent"
                >
                  <p className="w-full">{data.preAllocated}</p>
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow className="flex items-center justify-between">
              <TableCell className="text-base font-medium">Total</TableCell>
              <TableCell>
                <Badge
                  className="min-w-10 rounded-full text-center"
                  variant="accent"
                >
                  <p className="w-full">{data.all}</p>
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
