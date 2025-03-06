import { ReactNode } from "react";

import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";
import { Heading } from "@/components/heading";

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

  const instance = await api.institution.instance.get({ params });

  return (
    <section className="mr-12 w-full">
      <Heading>{instance.displayName}</Heading>
      {children}
    </section>
  );
}
