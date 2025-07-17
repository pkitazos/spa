import { redirect } from "next/navigation";

import { SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@/lib/auth";

import { SiteHeader } from "./_components/site-header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();
  // add whitelist of users
  if (!user) redirect("/");

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
