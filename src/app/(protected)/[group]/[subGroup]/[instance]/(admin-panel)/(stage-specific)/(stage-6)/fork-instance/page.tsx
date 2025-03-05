import { SubHeading } from "@/components/heading";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { ForkedInstanceForm } from "./_components/forked-instance-form";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.forkInstance.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const instance = await api.institution.instance.get({ params });

  if (instance.parentInstanceId) {
    return (
      <Unauthorised
        message={`Can't fork an already forked ${spacesLabels.instance.short}`}
      />
    );
  }

  const takenNames = await api.institution.subGroup.takenInstanceNames({
    params,
  });

  // TODO error in this file
  const currentInstance = { instanceName: instance.displayName, ...instance };
  return (
    <div className="mb-40 mt-10 flex h-max w-full max-w-5xl flex-col gap-10 px-12 pb-20">
      <SubHeading>{PAGES.forkInstance.title}</SubHeading>
      <ForkedInstanceForm
        currentInstance={currentInstance}
        takenNames={takenNames}
      />
    </div>
  );
}
