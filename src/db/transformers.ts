// TODO move these to some other file

import {
  DB_AllocationGroup,
  DB_AllocationInstance,
  DB_AllocationSubGroup,
  DB_Flag,
  DB_FlagOnProject,
  DB_ProjectDetails,
  DB_ProjectInInstance,
  DB_StudentDetails,
  DB_StudentProjectAllocation,
  DB_SupervisorDetails,
  DB_Tag,
  DB_TagOnProject,
  DB_User,
  DB_User,
  DB_UserInInstance,
} from "./types";

import {
  FlagDTO,
  GroupDTO,
  InstanceDTO,
  SubGroupDTO,
  TagDTO,
  UserInInstanceDTO,
} from "@/dto";
import { StudentDTO } from "@/dto/student";

export function allocationGroupToDTO(data: DB_AllocationGroup): GroupDTO {
  return { group: data.id, displayName: data.displayName };
}

export function allocationSubGroupToDTO(
  data: DB_AllocationSubGroup,
): SubGroupDTO {
  return {
    group: data.allocationGroupId,
    subGroup: data.id,
    displayName: data.displayName,
  };
}

export function allocationInstanceToDTO(
  data: DB_AllocationInstance,
): InstanceDTO {
  return {
    group: data.allocationGroupId,
    subGroup: data.allocationSubGroupId,
    instance: data.id,
    displayName: data.displayName,
    stage: data.stage,
    selectedAlgName: data.selectedAlgName ?? undefined,
    parentInstanceId: data.parentInstanceId ?? undefined,
    projectSubmissionDeadline: data.projectSubmissionDeadline,
    supervisorAllocationAccess: data.supervisorAllocationAccess,
    minStudentPreferences: data.minStudentPreferences,
    maxStudentPreferences: data.maxStudentPreferences,
    maxStudentPreferencesPerSupervisor: data.maxStudentPreferencesPerSupervisor,
    studentPreferenceSubmissionDeadline:
      data.studentPreferenceSubmissionDeadline,
    studentAllocationAccess: data.studentAllocationAccess,
    minReaderPreferences: data.minReaderPreferences,
    maxReaderPreferences: data.maxReaderPreferences,
    readerPreferenceSubmissionDeadline: data.readerPreferenceSubmissionDeadline,
  };
}

export declare function userInInstanceToDTO(
  data: DB_UserInInstance,
): UserInInstanceDTO;

export function projectInInstanceToDTO(
  data: DB_ProjectInInstance & { details: DB_ProjectDetails },
): ProjectInInstanceDTO {
  return {
    id: data.details.id,
    title: data.details.title,
    description: data.details.description,
    specialTechnicalRequirements:
      data.details.specialTechnicalRequirements ?? undefined,
    preAllocatedStudentId: data.details.preAllocatedStudentId ?? undefined,
    latestEditDateTime: data.details.latestEditDateTime,
    capacityLowerBound: data.details.capacityLowerBound,
    capacityUpperBound: data.details.capacityUpperBound,
    supervisorId: data.supervisorId,
  };
}

export declare function supervisorInInstanceToDTO(
  data: DB_SupervisorDetails & {
    userInInstance: DB_UserInInstance & { user: DB_User };
  },
): SupervisorDTO;

export declare function studentToDTO(data: unknown): StudentDTO;

export declare function tagToDTO(data: DB_Tag): TagDTO;

export declare function flagToDTO(data: DB_Flag): FlagDTO;

export function projectInstanceDataToDTO(
  data: DB_ProjectInInstance & {
    studentAllocations: (DB_StudentProjectAllocation & {
      student: DB_StudentDetails & {
        userInInstance: DB_UserInInstance & { user: DB_User };
      };
    })[];
    flagsOnProject: (DB_FlagOnProject & { flag: DB_Flag })[];
    tagsOnProject: (DB_TagOnProject & { tag: DB_Tag })[];
  },
): {
  project: ProjectInInstanceDTO;
  allocatedStudents: StudentDTO[];
  flags: FlagDTO[];
  tags: TagDTO[];
} {
  return;
}

type ProjectInInstanceDTO = {
  id: string;
  title: string;
  description: string;
  preAllocatedStudentId: string | undefined;
  specialTechnicalRequirements: string | undefined;
  latestEditDateTime: Date;
  capacityLowerBound: number;
  capacityUpperBound: number;
  supervisorId: string;
};
