import { ArrowRightIcon } from "lucide-react";

import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card, CardHeader } from "@/components/ui/card";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { MergeButton } from "./_components/merge-button";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.mergeInstance.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const forkedInstance = await api.institution.instance.get({ params });
  if (!forkedInstance.parentInstanceId) return;

  const parentInstance = await api.institution.instance.get({
    params: {
      group: params.group,
      subGroup: params.subGroup,
      instance: forkedInstance.parentInstanceId,
    },
  });

  return (
    <PanelWrapper className="mb-10 mt-10 flex h-max w-full flex-col gap-8 px-12 pb-10">
      <SubHeading>{PAGES.mergeInstance.title}</SubHeading>
      <p>
        You are about to merge {spacesLabels.instance.short}{" "}
        <span className="font-semibold">{forkedInstance.displayName}</span> into{" "}
        {spacesLabels.instance.short}{" "}
        <span className="font-semibold">{parentInstance.displayName}</span>.
        <div className="my-8 flex items-center justify-center gap-4">
          <Card className="w-max max-w-60 ">
            <WithTooltip
              tip={
                <p className="w-60 text-center text-base">
                  {forkedInstance.displayName}
                </p>
              }
            >
              <CardHeader className="truncate font-semibold text-primary">
                {forkedInstance.displayName}
              </CardHeader>
            </WithTooltip>
          </Card>
          <ArrowRightIcon className="h-7 w-7" />
          <Card className="w-max max-w-60 ">
            <WithTooltip
              tip={
                <p className="w-60 text-center text-base">
                  {parentInstance.displayName}
                </p>
              }
            >
              <CardHeader className="truncate font-semibold text-primary">
                {parentInstance.displayName}
              </CardHeader>
            </WithTooltip>
          </Card>
        </div>
        <p>
          Once you have merged, you will be unable to view the forked{" "}
          {spacesLabels.instance.short}
          details separately. Any algorithm results obtained and any algorithms
          created in the forked {spacesLabels.instance.short} will be lost be
          merging.{" "}
          <span className="font-semibold underline">
            Merging is final and cannot be undone.
          </span>
        </p>
      </p>
      <MergeButton
        forkedInstance={forkedInstance}
        parentInstance={parentInstance}
      ></MergeButton>
    </PanelWrapper>
  );
}
