import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InvitedUser = { id: string; name: string; email: string; joined: boolean };

export function InviteTable({ users }: { users: InvitedUser[] }) {
  const totalJoined = users.reduce(
    (acc, { joined }) => acc + Number(joined),
    0,
  );
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-accent/50">
          <TableHead>Full Name</TableHead>
          <TableHead>GUID</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(({ id, name, email, joined }) => (
          <TableRow key={id}>
            <TableCell className="font-medium">{name}</TableCell>
            <TableCell>{id}</TableCell>
            <TableCell>{email}</TableCell>
            <TableCell>
              {joined ? (
                <Badge className="bg-green-700">joined</Badge>
              ) : (
                <Badge className="bg-muted-foreground">invited</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total joined</TableCell>
          <TableCell colSpan={1} className="text-center">
            {totalJoined}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
