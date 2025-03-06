import { ReactNode } from "react";

import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";
import { Role } from "@/db/types";

export default async function Layout({
  params,
  children,
}: {
  params: InstanceParams;
  children: ReactNode;
}) {
  const roles = await api.user.roles({ params });

  if (!roles.has(Role.SUPERVISOR) && !roles.has(Role.READER)) {
    return (
      <Unauthorised message="You need to be a Supervisor or Reader to access this page" />
    );
  }

  return <section className="mr-12 w-full">{children}</section>;
}
