import { type ReactNode } from "react";

import { type ClassValue } from "clsx";
import { HashIcon, User2Icon } from "lucide-react";

import { type User } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { getColorFromName, getInitials } from "@/lib/utils/avatar-icon-helpers";

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function UserDetailsCard({
  user,
  className,
  full = false,
  children: additionalRows,
}: {
  user: User;
  className?: ClassValue;
  full?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        {full ? (
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback
                className={cn(
                  "bg-gray-100 text-gray-600 text-xl",
                  getColorFromName(user.name),
                )}
              >
                {user?.name ? getInitials(user.name) : <User2Icon />}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">user</p>
            </div>
          </div>
        ) : (
          <CardTitle className="text-xl">User Info</CardTitle>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col justify-evenly gap-4">
          <div className="flex items-center">
            <User2Icon className="mr-2 h-4 w-4 opacity-70" />
            <span className="mr-2 font-semibold">ID:</span>
            {user.id}
          </div>
          <div className="flex items-center">
            <HashIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="mr-2 font-semibold">Email:</span>
            {user.email}
          </div>
          {additionalRows}
        </div>
      </CardContent>
    </Card>
  );
}
