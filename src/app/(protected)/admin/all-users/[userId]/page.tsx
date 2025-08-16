import { UserIcon, ListIcon } from "lucide-react";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";

import { EditUserDetailsForm } from "./_components/edit-user-details-form";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { userId: string } }) {
  const { user, isSuperAdmin } = await api.institution.getDetailsForUser({
    userId: params.userId,
  });

  return (
    <PanelWrapper className="mt-5 gap-10">
      <Heading>
        <span className="text-muted-foreground text-4xl">User: </span>
        {user.name}{" "}
        <span className="text-muted-foreground text-4xl">({user.id})</span>
      </Heading>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-indigo-600" />
              <span className="font-medium">Edit Core Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditUserDetailsForm user={user} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListIcon className="h-6 w-6 text-indigo-600" />
              <span className="font-medium">Roles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuperAdmin && (
              <div>
                <Badge variant="destructive" className="text-sm">
                  Super Administrator
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Full system access and control
                </p>
              </div>
            )}
          </CardContent>
          {/* // TODO: fill in everything else eventually  */}
        </Card>
      </div>
    </PanelWrapper>
  );
}
