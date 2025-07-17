import { type ReactNode } from "react";

import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";

export default async function Layout({ children }: { children: ReactNode }) {
  const access = await api.institution.superAdminAccess();

  if (!access) {
    return (
      <Unauthorised message="You need to be a super-admin to access this page" />
    );
  }

  return <>{children}</>;
}
