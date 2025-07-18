"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { type UserDTO } from "@/dto";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { switchDevUser } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

import { getColorFromName, getInitials } from "./utils";

interface UserSwitcherProps {
  users: UserDTO[];
  currentUserId: string;
}

export function UserSwitcher({ users, currentUserId }: UserSwitcherProps) {
  const router = useRouter();
  const user = users.find((a) => a.id === currentUserId);

  if (!user) {
    throw new Error("Current user not found in users list!");
  }

  const handleUserChange = async (newUserId: string) => {
    if (newUserId === currentUserId) return;

    await switchDevUser(newUserId);
    router.refresh();
  };

  if (users && users.length > 1) {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Test User
        </DropdownMenuLabel>
        {users.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleUserChange(account.id)}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className={cn("text-xs", getColorFromName(account.name))}
                >
                  {getInitials(account.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm">{account.name}</span>
                <span className="text-xs text-muted-foreground">
                  {account.id}
                </span>
                <span className="text-xs text-muted-foreground">
                  {account.email}
                </span>
              </div>
            </div>
            {account.id === user.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </>
    );
  }
}
