import { FileSpreadsheetIcon, InfoIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { DownloadPreferenceDataSection } from "./_components/download-preference-section";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.preferenceStatistics.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  return (
    <PanelWrapper className="gap-16">
      <Heading className="mb-4">{PAGES.preferenceStatistics.title}</Heading>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading icon={InfoIcon}>Download Statistics</SectionHeading>
        <Card className="w-full">
          <CardContent className="mt-6 flex items-center justify-between gap-10">
            <p>
              The student preference data is grouped by{" "}
              <span className="font-semibold">Project</span>,{" "}
              <span className="font-semibold">Supervisor</span>, or{" "}
              <span className="font-semibold">Keyword</span>. Each grouping has
              two formats,{" "}
              <WithTooltip
                align="start"
                side="bottom"
                tip={<AggregatedDataExample />}
              >
                <span className="underline decoration-muted-foreground decoration-dotted">
                  aggregated
                </span>
              </WithTooltip>{" "}
              and{" "}
              <WithTooltip
                align="start"
                side="bottom"
                tip={<NormalisedDataExample />}
              >
                <span className="underline decoration-muted-foreground decoration-dotted">
                  normalised
                </span>
              </WithTooltip>
              .
            </p>
          </CardContent>
        </Card>
      </section>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading icon={FileSpreadsheetIcon}>
          Download student preferences by Grouping
        </SectionHeading>
        <DownloadPreferenceDataSection params={params} />
      </section>
    </PanelWrapper>
  );
}

function AggregatedDataExample() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project ID</TableHead>
          <TableHead>Count</TableHead>
          <TableHead>Student 1 ID</TableHead>
          <TableHead>Student 1 Rank</TableHead>
          <TableHead>Student 2 ID</TableHead>
          <TableHead>Student 2 Rank</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>0123-abcd</TableCell>
          <TableCell>2</TableCell>
          <TableCell>1234567a</TableCell>
          <TableCell>1</TableCell>
          <TableCell>2345678b</TableCell>
          <TableCell>3</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>4568-efgh</TableCell>
          <TableCell>1</TableCell>
          <TableCell>2345678b</TableCell>
          <TableCell>5</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function NormalisedDataExample() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project ID</TableHead>
          <TableHead>Student ID</TableHead>
          <TableHead>Rank</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>0123-abcd</TableCell>
          <TableCell>1234567a</TableCell>
          <TableCell>1</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>0123-abcd</TableCell>
          <TableCell>2345678b</TableCell>
          <TableCell>3</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>4568-efgh</TableCell>
          <TableCell>2345678b</TableCell>
          <TableCell>5</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
