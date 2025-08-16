import { UnplugIcon } from "lucide-react";
import Link from "next/link";

import { app } from "@/config/meta";

import { Separator } from "@/components/ui/separator";
import { ToggleSidebarButton } from "@/components/ui/sidebar";

import { Breadcrumbs } from "./breadcrumbs";
import { UserButton } from "./user-button";

export async function SiteHeader() {
  return (
    <header className="flex fixed top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-3 px-4">
        <Link href="/" className="flex gap-2 items-center mr-8">
          <UnplugIcon className="text-indigo-700" />
          <p className="text-2xl">{app.name}</p>
        </Link>
        <ToggleSidebarButton />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs />
        <div className="ml-auto flex basis-1/4 items-center justify-end gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
