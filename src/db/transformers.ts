// MOVE these to some other file

import {
  DB_AllocationGroup,
  DB_AllocationInstance,
  DB_AllocationSubGroup,
  DB_Flag,
  DB_FlagOnStudent,
  DB_ProjectDetails,
  DB_ProjectInInstance,
  DB_StudentDetails,
  DB_SupervisorDetails,
  DB_Tag,
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
import { ProjectDTO } from "@/dto/project";
import {
  StudentDetailsDTO,
  StudentDTO,
  StudentPreferenceRestrictionsDTO,
} from "@/dto/student";
import { SupervisorDetailsDTO } from "@/dto/supervisor";
import { SupervisorDTO } from "@/dto/supervisor_router";

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
    selectedAlgConfigId: data.selectedAlgConfigId ?? undefined,
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

export function supervisorToDTO(
  data: DB_SupervisorDetails & {
    userInInstance: DB_UserInInstance & { user: DB_User };
  },
): SupervisorDTO {
  return {
    id: data.userId,
    name: data.userInInstance.user.name,
    email: data.userInInstance.user.email,
    projectTarget: data.projectAllocationTarget,
    projectUpperQuota: data.projectAllocationUpperBound,
  };
}

export function supervisorDetailsToDTO(
  data: DB_SupervisorDetails,
): SupervisorDetailsDTO {
  return {
    supervisorId: data.userId,
    projectTarget: data.projectAllocationTarget,
    projectUpperQuota: data.projectAllocationUpperBound,
  };
}

export function studentToDTO(
  data: DB_StudentDetails & {
    userInInstance: DB_UserInInstance & { user: DB_User };
  },
): StudentDTO {
  return {
    id: data.userId,
    name: data.userInInstance.user.name,
    email: data.userInInstance.user.email,
    level: data.studentLevel,
    latestSubmissionDateTime: data.latestSubmissionDateTime ?? undefined,
  };
}

export function studentDetailsToDto(
  data: DB_StudentDetails & {
    studentFlags: (DB_FlagOnStudent & { flag: DB_Flag })[];
  },
): StudentDetailsDTO {
  return {
    studentId: data.userId,
    level: data.studentLevel,
    latestSubmissionDateTime: data.latestSubmissionDateTime ?? undefined,
    flags: data.studentFlags.map((f) => f.flag),
  };
}

export function instanceToStudentPreferenceRestrictionsDTO(
  data: InstanceDTO,
): StudentPreferenceRestrictionsDTO {
  return {
    minPreferences: data.minStudentPreferences,
    maxPreferences: data.maxStudentPreferences,
    maxPreferencesPerSupervisor: data.maxStudentPreferencesPerSupervisor,
    preferenceSubmissionDeadline: data.studentPreferenceSubmissionDeadline,
  };
}

export function projectDataToDTO(
  data: DB_ProjectInInstance & { details: DB_ProjectDetails },
): ProjectDTO {
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

export function tagToDTO(data: DB_Tag): TagDTO {
  return { id: data.id, title: data.title };
}

export function flagToDTO(data: DB_Flag): FlagDTO {
  return { id: data.id, title: data.title, description: data.description };
}

export function userInInstanceToDTO(
  data: DB_UserInInstance,
): UserInInstanceDTO {
  return {
    userId: data.userId,
    joined: data.joined,
    group: data.allocationGroupId,
    subGroup: data.allocationSubGroupId,
    instance: data.allocationInstanceId,
  };
}
