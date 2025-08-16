import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { type SubGroupParams } from "@/lib/validations/params";

import { WizardSection } from "./_components/wizard-section";

export async function generateMetadata({ params }: { params: SubGroupParams }) {
  const { displayName } = await api.institution.subGroup.get({ params });

  return {
    title: metadataTitle([PAGES.newInstance.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: SubGroupParams }) {
  const access = await api.institution.subGroup.access({ params });

  if (!access) {
    return (
      <Unauthorised message="You need to be a super-admin or group admin to access this page" />
    );
  }

  const takenNames = await api.institution.subGroup.takenInstanceNames({
    params,
  });

  return (
    <PanelWrapper className="mt-5 gap-10">
      <Heading className="text-4xl">
        Create new {spacesLabels.instance.full}
      </Heading>
      <WizardSection params={params} takenNames={takenNames} />
    </PanelWrapper>
  );
}
