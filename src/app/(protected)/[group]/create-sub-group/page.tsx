import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { type GroupParams } from "@/lib/validations/params";

import { FormSection } from "./_components/form-section";

export async function generateMetadata({ params }: { params: GroupParams }) {
  const { displayName } = await api.institution.group.get({ params });

  return {
    title: metadataTitle([PAGES.newSubGroup.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: GroupParams }) {
  const access = await api.institution.group.access({ params });

  if (!access) {
    return (
      <Unauthorised message="You need to be a super-admin or group admin to access this page" />
    );
  }

  const takenNames = await api.institution.group.takenSubGroupNames({ params });

  return (
    <PanelWrapper className="mt-5 gap-10">
      <Heading className="text-4xl">
        Create new {spacesLabels.subGroup.full}
      </Heading>
      <FormSection takenNames={takenNames} params={params} />
    </PanelWrapper>
  );
}
