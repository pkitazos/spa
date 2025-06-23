import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight } from "lucide-react";
import { InstanceDisplayData } from "@/dto";
import { Role } from "@/db/types";

type InstanceWithRoles = InstanceDisplayData & { roles: Role[] };

export function InstanceCard({
  instanceData,
}: {
  instanceData: InstanceWithRoles;
}) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case Role.ADMIN:
        return "bg-orange-100 text-orange-800";
      case Role.SUPERVISOR:
        return "bg-blue-100 text-blue-800";
      case Role.READER:
        return "bg-purple-100 text-purple-800";
      case Role.STUDENT:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="mb-2 flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-xl font-semibold">
            {instanceData.instance.displayName}
          </CardTitle>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div>{instanceData.subGroup.displayName}</div>
          <div>{instanceData.group.displayName}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4 mt-2 flex flex-wrap gap-2">
          {instanceData.roles.map((role) => (
            <Badge key={role} className={getRoleColor(role)}>
              {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
            </Badge>
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        >
          Enter Instance
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
