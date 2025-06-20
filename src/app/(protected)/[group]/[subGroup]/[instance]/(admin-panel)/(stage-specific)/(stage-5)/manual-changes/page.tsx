import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { ManualAllocationTable } from "./_components/manual-allocation-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.manualChanges.title, displayName, app.name]),
  };
}
export default async function Page({ params }: { params: InstanceParams }) {
  const allStudents = await api.institution.instance.students({ params });

  const { projects, supervisors } =
    await api.institution.instance.allProjectsWithStatus({ params });

  const initialStudents = allStudents
    .filter((s) => !s.allocation)
    .map(({ student, allocation }) => ({
      studentId: student.id,
      studentName: student.name,
      studentFlags: student.flags,
      originalProjectId: allocation?.id,
      originalSupervisorId: allocation?.supervisorId,
      newProjectId: undefined,
      newSupervisorId: undefined,
      isDirty: false,
      warnings: [],
    }));

  const initialProjects = projects.map(({ project, student, status }) => ({
    id: project.id,
    title: project.title,
    // flags: project.flags,
    flags: [
      { id: "level-4", title: "Level 4", description: "" },
      { id: "level-5", title: "Level 5", description: "" },
    ],
    originalSupervisorId: project.supervisorId,
    currentStudentAllocationId: student,
    status,
  }));

  const initialSupervisors = supervisors.map(({ supervisor, allocations }) => ({
    id: supervisor.id,
    name: supervisor.name,
    allocationTarget: supervisor.allocationTarget,
    allocationUpperBound: supervisor.allocationUpperBound,
    currentAllocations: allocations.length,
    pendingAllocations: 0,
  }));

  return (
    <PanelWrapper className="mt-10 flex h-full">
      <SubHeading className="mb-4">{PAGES.manualChanges.title}</SubHeading>
      <ManualAllocationTable
        initialStudents={initialStudents}
        initialProjects={initialProjects}
        initialSupervisors={initialSupervisors}
      />
    </PanelWrapper>
  );
}
