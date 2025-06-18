import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { ProjectsCombobox } from "./projects-combobox";
import { SupervisorsCombobox } from "./supervisors-combobox";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.manualChanges.title, displayName, app.name]),
  };
}
export default async function Page({ params }: { params: InstanceParams }) {
  const unmatchedStudents = await api.institution.instance.unmatchedStudents({
    params,
  });

  if (unmatchedStudents.length === 0) {
    return (
      <PanelWrapper className="mt-10">
        <SubHeading className="mb-4">{PAGES.manualChanges.title}</SubHeading>
        <p className="text-gray-500">No unmatched students found.</p>
      </PanelWrapper>
    );
  }

  const { projects, supervisors } =
    await api.institution.instance.allProjectsWithStatus({ params });

  return (
    <PanelWrapper className="mt-10 flex h-full">
      <SubHeading className="mb-4">{PAGES.manualChanges.title}</SubHeading>
      {unmatchedStudents.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold">Unmatched Students</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Student</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Supervisor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmatchedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="flex flex-col items-start gap-1 font-medium">
                    <span className="font-semibold">{student.id}</span>
                    <span className="text-gray-500">{student.name}</span>
                  </TableCell>
                  <TableCell>
                    <ProjectsCombobox projects={projects} />
                  </TableCell>
                  <TableCell>
                    <SupervisorsCombobox supervisors={supervisors} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PanelWrapper>
  );
}
