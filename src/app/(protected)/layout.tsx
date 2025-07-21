import { env } from "@/env";
import { redirect } from "next/navigation";

import { SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/server";

import { SiteHeader } from "./_components/site-header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();

  if (!user) redirect("/");

  // Currently we're doing a platform-wide testing block
  // If the user is not whitelisted, redirect them to the test message page
  // would be better to have a more granular control in the future, i.e. per group, sub-group, or instance
  if (
    env.AMPS_ACCESS_CONTROL === "whitelist" &&
    !(await api.ac.whitelisted())
  ) {
    redirect("/unauthorised");
  }

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <main className="top-[calc(var(--header-height)-1px)] relative w-full items-start justify-center flex">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
