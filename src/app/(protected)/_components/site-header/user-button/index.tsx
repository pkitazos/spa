import { env } from "@/env";
import { User2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { getColorFromName, getInitials } from "@/lib/utils/avatar-icon-helpers";

import { UserSwitcher } from "./user-switcher";

export async function UserButton() {
  const testUsers = await api.user.getTestUsers();

  const { mask: user } = await auth();

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarFallback
              className={cn(
                "bg-gray-100 text-gray-600",
                getColorFromName(user.name),
              )}
            >
              {user?.name ? getInitials(user.name) : <User2 />}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-4 mt-3 w-fit min-w-40 max-w-80">
          {user && (
            <>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    {env.AUTH_FROM_HEADERS === "OFF" && (
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                        DEV
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.id}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              {env.AUTH_MASKING_ENABLED === "ON" && (
                <UserSwitcher users={testUsers} currentUserId={user.id} />
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
