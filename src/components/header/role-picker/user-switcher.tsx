"use client";
import { User2, Check } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserDTO } from "@/dto";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const nameParts = name.trim().split(" ");

  if (nameParts.length === 0) return "U";

  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  return (
    nameParts[0].charAt(0).toUpperCase() +
    nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  );
}

function getColorFromName(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const twColours = [
    { bg: "bg-red-100", text: "text-red-700" },
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-green-100", text: "text-green-700" },
    { bg: "bg-yellow-100", text: "text-yellow-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
    { bg: "bg-pink-100", text: "text-pink-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
    { bg: "bg-orange-100", text: "text-orange-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-cyan-100", text: "text-cyan-700" },
    { bg: "bg-lime-100", text: "text-lime-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
  ];

  const colorIndex = Math.abs(hash) % twColours.length;
  return twColours[colorIndex];
}

interface UserSwitcherProps {
  users: UserDTO[];
  currentUserId: string;
  switchUser: (userId: string) => Promise<void>;
}

export function UserSwitcher({
  users,
  currentUserId,
  switchUser,
}: UserSwitcherProps) {
  const router = useRouter();
  const user = users.find((a) => a.id === currentUserId);

  if (!user) {
    throw new Error("Current user not found in users list!");
  }

  const handleUserChange = async (newUserId: string) => {
    if (newUserId === currentUserId) return;

    await switchUser(newUserId);
    router.refresh();
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarFallback
              className={cn(
                "bg-gray-100 text-gray-600",
                getColorFromName(user.name).bg,
                getColorFromName(user.name).text,
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
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                      DEV
                    </span>
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.id}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              {users && users.length > 1 && (
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
                            className={cn(
                              "text-xs",
                              getColorFromName(account.name).bg,
                              getColorFromName(account.name).text,
                            )}
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
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
