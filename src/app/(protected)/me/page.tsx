import { type Metadata } from "next";

import { app, metadataTitle } from "@/config/meta";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { UserDetailsCard } from "@/components/user-details-card";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: metadataTitle(["me", app.institution.name, app.name]),
};

export default async function Page() {
  const { mask: user } = await auth();
  return (
    <PanelWrapper className="pt-4 gap-10">
      <Heading>me</Heading>
      <UserDetailsCard user={user} full />
    </PanelWrapper>
  );
}
