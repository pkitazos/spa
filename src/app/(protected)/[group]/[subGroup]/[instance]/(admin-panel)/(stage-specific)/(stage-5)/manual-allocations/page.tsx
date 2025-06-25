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
    title: metadataTitle([
      PAGES.manualAllocations.title,
      displayName,
      app.name,
    ]),
  };
}
export default async function Page({ params }: { params: InstanceParams }) {
  const unallocatedStudents =
    await api.institution.instance.getUnallocatedStudents({ params });

  const manuallyAllocatedStudentData =
    await api.institution.instance.getManuallyAllocatedStudents({ params });

  const unallocatedStudentData = unallocatedStudents.map((student) => ({
    student,
    project: undefined,
  }));

  const allStudents = [
    ...unallocatedStudentData,
    ...manuallyAllocatedStudentData,
  ];

  const initialStudents = allStudents.map(({ student, project }) => ({
    studentId: student.id,
    studentName: student.name,
    studentFlags: student.flags,
    originalProjectId: project?.id,
    originalSupervisorId: project?.supervisorId,
    newProjectId: undefined,
    newSupervisorId: undefined,
    isDirty: false,
    warnings: [],
  }));

  const projectData =
    await api.institution.instance.getProjectsWithAllocationStatus({ params });

  const supervisors =
    await api.institution.instance.getSupervisorsWithAllocations({ params });

  const initialProjects = projectData.map(({ project, studentId, status }) => ({
    id: project.id,
    title: project.title,
    flags: project.flags,
    originalSupervisorId: project.supervisorId,
    currentStudentAllocationId: studentId,
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
      <SubHeading className="mb-4">{PAGES.manualAllocations.title}</SubHeading>
      <ManualAllocationTable
        initialStudents={initialStudents}
        initialProjects={initialProjects}
        initialSupervisors={initialSupervisors}
      />
    </PanelWrapper>
  );
}
