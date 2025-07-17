import { ExportCSVButton } from "@/components/export-csv";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

export async function DownloadPreferenceDataSection({
  params,
}: {
  params: InstanceParams;
}) {
  const projectData = await api.institution.instance.preference.statsByProject({
    params,
  });

  const supervisorData =
    await api.institution.instance.preference.statsBySupervisor({ params });

  const tagData = await api.institution.instance.preference.statsByTag({
    params,
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grouping</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Row filename="Project" formatVersion="aggregated">
              <ExportCSVButton
                header={projectData.aggregated.header}
                data={projectData.aggregated.rows}
                filename="by-project-aggregated"
              />
            </Row>
            <Row filename="Project" formatVersion="normalised">
              <ExportCSVButton
                header={projectData.normalised.header}
                data={projectData.normalised.rows}
                filename="by-project-normalised"
              />
            </Row>
            <Row filename="Supervisor" formatVersion="aggregated">
              <ExportCSVButton
                header={supervisorData.aggregated.header}
                data={supervisorData.aggregated.rows}
                filename="by-supervisor-aggregated"
              />
            </Row>
            <Row filename="Supervisor" formatVersion="normalised">
              <ExportCSVButton
                header={supervisorData.normalised.header}
                data={supervisorData.normalised.rows}
                filename="by-supervisor-normalised"
              />
            </Row>
            <Row filename="Keyword" formatVersion="aggregated">
              <ExportCSVButton
                header={tagData.aggregated.header}
                data={tagData.aggregated.rows}
                filename="by-keyword-aggregated"
              />
            </Row>
            <Row filename="Keyword" formatVersion="normalised">
              <ExportCSVButton
                header={tagData.normalised.header}
                data={tagData.normalised.rows}
                filename="by-keyword-normalised"
              />
            </Row>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Row({
  filename,
  formatVersion,
  children,
}: {
  filename: string;
  formatVersion: string;
  children: React.ReactNode;
}) {
  return (
    <TableRow className="flex items-center justify-between">
      <TableCell>
        <p className="text-base font-medium">{filename}</p>
        <p className="hidden text-sm text-muted-foreground md:inline">
          {formatVersion}
        </p>
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="icon"
          className="flex items-center justify-center"
        >
          {children}
        </Button>
      </TableCell>
    </TableRow>
  );
}
