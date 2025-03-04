import { Metadata } from "next";

import { PageWrapper } from "@/components/page-wrapper";
import { UserDetailsCard } from "@/components/user-details-card";

import { auth } from "@/lib/auth";

import { app, metadataTitle } from "@/config/meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: metadataTitle(["me", app.institution.name, app.name]),
};

export default async function Page() {
  const user = await auth();
  return (
    <PageWrapper className="grid place-items-center">
      {user ? <UserDetailsCard user={user} full /> : <p>not authenticated</p>}
    </PageWrapper>
  );
}
