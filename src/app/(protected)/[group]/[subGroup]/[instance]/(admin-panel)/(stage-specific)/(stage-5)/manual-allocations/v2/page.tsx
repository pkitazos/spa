import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { ManualAllocationDataTableSection } from "./manual-allocation-table-section";

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

  const allocatedStudents = await api.institution.instance.getAllocatedStudents(
    { params },
  );

  const unallocatedStudentData = unallocatedStudents.map((student) => ({
    student,
    project: undefined,
  }));

  const allStudents = [...unallocatedStudentData, ...allocatedStudents];

  const projectData =
    await api.institution.instance.getProjectsWithAllocationStatus({ params });

  const supervisorData =
    await api.institution.instance.getSupervisorsWithAllocations({ params });

  const students = allStudents.map(({ student, project }) => ({
    ...student,
    originalProjectId: project?.id,
    originalSupervisorId: project?.supervisorId,
    selectedProjectId: undefined,
    selectedSupervisorId: undefined,
    isDirty: false,
    warnings: [],
  }));

  const projects = projectData.map(({ project, studentId, status }) => ({
    ...project,
    status,
    currentStudentAllocationId: studentId,
  }));

  const supervisors = supervisorData.map(({ supervisor, allocations }) => ({
    ...supervisor,
    currentAllocations: allocations.length,
    pendingAllocations: 0,
  }));

  return (
    <PanelWrapper className="mt-10 flex h-full">
      <SubHeading className="mb-4">{PAGES.manualAllocations.title}</SubHeading>
      <ManualAllocationDataTableSection
        initialStudents={students}
        initialProjects={projects}
        initialSupervisors={supervisors}
      />
    </PanelWrapper>
  );
}
