import { Stage } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";

import {
  checkAllocationInstanceExists,
  getAllFlags,
  getAllocationInstance,
  getAllocationInstanceWithFlagsAndTags,
  getAllStudents,
  getAllSupervisorDetails,
  getAllSupervisors,
  getSelectedAlgorithm_fromDB,
  updateAllocationInstanceStage,
} from "@/data-access/instance";
import { StudentProjectAllocationData } from "@/data-objects/student-project-allocation-data";

export async function getProjectAllocations({
  params,
}: {
  params: InstanceParams;
}) {
  const allocationData = await StudentProjectAllocationData.fromDB(params);

  const byStudent = allocationData.toStudentView();
  const byProject = allocationData.toProjectView();
  const bySupervisor = allocationData.toSupervisorView();

  return { byStudent, byProject, bySupervisor };
}

export async function updateStage({
  params,
  stage,
}: {
  params: InstanceParams;
  stage: Stage;
}) {
  await updateAllocationInstanceStage(params, stage);
}

export async function checkInstanceExists({
  params,
}: {
  params: InstanceParams;
}) {
  return await checkAllocationInstanceExists(params);
}

export async function getInstance({ params }: { params: InstanceParams }) {
  return await getAllocationInstance(params);
}

export async function getSelectedAlgorithm({
  params,
  selectedAlgName,
}: {
  params: InstanceParams;
  selectedAlgName: string | null;
}) {
  if (!selectedAlgName) {
    return {
      id: "",
      displayName: "",
    };
  }

  const algorithm = await getSelectedAlgorithm_fromDB(params, selectedAlgName);

  return {
    id: algorithm.algName,
    displayName: algorithm.displayName,
  };
}

export async function getEditFormDetails({
  params,
}: {
  params: InstanceParams;
}) {
  const data = await getAllocationInstanceWithFlagsAndTags(params);

  return {
    ...data,
    instanceName: data.displayName,
    minNumPreferences: data.minStudentPreferences,
    maxNumPreferences: data.maxStudentPreferences,
    maxNumPerSupervisor: data.maxStudentPreferencesPerSupervisor,
  };
}

export async function getStudents({ params }: { params: InstanceParams }) {
  return await getAllStudents(params);
}

export async function getSupervisors({ params }: { params: InstanceParams }) {
  return await getAllSupervisors(params);
}

export async function getSupervisorDetails({
  params,
}: {
  params: InstanceParams;
}) {
  return await getAllSupervisorDetails(params);
}

export async function getFlagTitles({ params }: { params: InstanceParams }) {
  const flags = await getAllFlags(params);
  return flags.map((f) => f.title);
}
