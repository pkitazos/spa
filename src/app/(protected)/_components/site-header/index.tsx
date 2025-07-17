import { env } from "@/env";
import { UnplugIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import { app } from "@/config/meta";

import { Separator } from "@/components/ui/separator";
import { ToggleSidebarButton } from "@/components/ui/sidebar";

import { api } from "@/lib/trpc/server";

import { Breadcrumbs } from "./breadcrumbs";
import { RolePicker } from "./role-picker";
import { UserButton } from "./user-button";

export async function SiteHeader() {
  const headersList = headers();

  const path = headersList.get("referer") ?? "";
  console.log("test", path);
  const inInstance = await api.institution.safeInInstance({ path });

  return (
    <header className="flex fixed top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-[--header-height] w-full items-center gap-3 px-4">
        <Link href="/" className="flex gap-2 items-center mr-8">
          <UnplugIcon className="text-indigo-700" />
          <p className="text-2xl">{app.name}</p>
        </Link>
        {inInstance ? <ToggleSidebarButton /> : <div className="h-8 w-8" />}
        {/* <Separator orientation="vertical" className="mr-2 h-4" />
        <PageTitle /> */}
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs />
        <div className="ml-auto flex basis-1/4 items-center justify-end gap-4">
          {env.DEV_ENV === "PROD" ? <UserButton /> : <RolePicker />}
        </div>
      </div>
    </header>
  );
}
