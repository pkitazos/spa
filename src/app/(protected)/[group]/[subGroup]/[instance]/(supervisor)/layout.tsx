import { type ReactNode } from "react";

import { Role } from "@/db/types";

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
  const roles = await api.user.roles({ params });

  if (!roles.has(Role.SUPERVISOR)) {
    return (
      <Unauthorised message="You need to be a Supervisor to access this page" />
    );
  }

  return <section className="mr-12 w-full">{children}</section>;
}
