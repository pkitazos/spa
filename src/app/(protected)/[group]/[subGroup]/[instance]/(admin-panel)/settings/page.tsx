import { List, PenIcon } from "lucide-react";
import Link from "next/link";

import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { DeleteConfirmation } from "./_components/delete-confirmation";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.settings.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const instance = await api.institution.instance.get({ params });
  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-10 px-12">
      <SubHeading className="mb-4">Settings</SubHeading>
      <section className="flex w-full flex-col gap-6">
        <SectionHeading className="mb-2 flex items-center">
          <List className="mr-2 h-6 w-6 text-indigo-500" />
          <span>{spacesLabels.instance.short} Details</span>
        </SectionHeading>
        <Card className="w-full">
          <CardContent className="flex items-center justify-between gap-5 pt-6">
            <CardDescription className="text-base text-muted-foreground">
              Modify {spacesLabels.instance.short}-specific details.
            </CardDescription>
            <Button size="lg" asChild>
              <Link className="flex items-center gap-2" href="./edit">
                <PenIcon className="h-4 w-4" />
                View or Edit
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      <DeleteConfirmation
        className="w-full"
        spaceLabel={spacesLabels.instance.short}
        name={instance.displayName}
      />
    </PanelWrapper>
  );
}
