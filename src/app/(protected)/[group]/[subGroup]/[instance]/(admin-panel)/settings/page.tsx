import { ListIcon, PenIcon } from "lucide-react";
import Link from "next/link";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { DeleteConfirmation } from "./_components/delete-confirmation";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.settings.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const instance = await api.institution.instance.get({ params });

  return (
    <PanelWrapper>
      <Heading className="mb-4">{PAGES.settings.title}</Heading>
      <section className="flex w-full flex-col gap-6 mb-6">
        <SectionHeading icon={ListIcon} className="mb-2">
          {spacesLabels.instance.short} Details
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
