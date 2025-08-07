import { env } from "@/env";
import { redirect } from "next/navigation";

import { SidebarProvider } from "@/components/ui/sidebar";

import { auth, whitelisted } from "@/lib/auth";

import { SiteHeader } from "./_components/site-header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { real: user } = await auth();

  if (!user) redirect("/");

  // Currently we're doing a platform-wide testing block
  // If the user is not whitelisted, redirect them to the test message page
  // would be better to have a more granular control in the future, i.e. per group, sub-group, or instance
  if (env.AUTH_WHITELIST_ENABLED === "ON" && !whitelisted(user)) {
    redirect("/unauthorised");
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <main className="top-[calc(var(--header-height)-1px)] relative w-full items-start justify-center flex">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
