import { type ReactNode } from "react";

import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

export default async function Layout({
  params,
  children,
}: {
  params: InstanceParams;
  children: ReactNode;
}) {
  const access = await api.ac.adminInInstance({ params });
  if (!access) {
    // could potentially throw error as this should be caught by the layout one level up
    return (
      <Unauthorised message="You need to be an admin to access this page" />
    );
  }

  return <>{children};</>;
}
