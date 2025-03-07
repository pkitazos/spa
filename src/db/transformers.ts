// MOVE these to some other file

import { GradedSubmissionDTO } from "@/dto";
import {
  DB_Algorithm,
  DB_AllocationGroup,
  DB_AllocationInstance,
  DB_AllocationSubGroup,
  DB_Flag,
  DB_FlagOnProject,
  DB_FlagOnStudent,
  DB_GradedSubmission,
  DB_Project,
  DB_ReaderDetails,
  DB_StudentDetails,
  DB_SupervisorDetails,
  DB_Tag,
  DB_TagOnProject,
  DB_User,
  DB_UserInInstance,
} from "./types";

import {
  AlgorithmDTO,
  FlagDTO,
  GroupDTO,
  InstanceDTO,
  InstanceUserDTO,
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  SubGroupDTO,
  SupervisorDTO,
  TagDTO,
} from "@/dto";

export class Transformers {
  public static toAllocationGroupDTO(data: DB_AllocationGroup): GroupDTO {
    return { group: data.id, displayName: data.displayName };
  }

  public static toAllocationSubGroupDTO(
    data: DB_AllocationSubGroup,
  ): SubGroupDTO {
    return {
      group: data.allocationGroupId,
      subGroup: data.id,
      displayName: data.displayName,
    };
  }

  public static toAllocationInstanceDTO(
    data: DB_AllocationInstance,
  ): InstanceDTO {
    return {
      group: data.allocationGroupId,
      subGroup: data.allocationSubGroupId,
      instance: data.id,
      displayName: data.displayName,
      stage: data.stage,
      selectedAlgConfigId: data.selectedAlgId ?? undefined,
      parentInstanceId: data.parentInstanceId ?? undefined,
      projectSubmissionDeadline: data.projectSubmissionDeadline,
      supervisorAllocationAccess: data.supervisorAllocationAccess,
      minStudentPreferences: data.minStudentPreferences,
      maxStudentPreferences: data.maxStudentPreferences,
      maxStudentPreferencesPerSupervisor:
        data.maxStudentPreferencesPerSupervisor,
      studentPreferenceSubmissionDeadline:
        data.studentPreferenceSubmissionDeadline,
      studentAllocationAccess: data.studentAllocationAccess,
      minReaderPreferences: data.minReaderPreferences,
      maxReaderPreferences: data.maxReaderPreferences,
      readerPreferenceSubmissionDeadline:
        data.readerPreferenceSubmissionDeadline,
    };
  }

  public static toInstanceUserDTO(
    data: DB_UserInInstance & { user: DB_User },
  ): InstanceUserDTO {
    return {
      id: data.userId,
      name: data.user.name,
      email: data.user.email,
      joined: data.joined,
    };
  }

  public static toStudentDTO(
    data: DB_StudentDetails & {
      userInInstance: DB_UserInInstance & { user: DB_User };
      studentFlags: (DB_FlagOnStudent & { flag: DB_Flag })[];
    },
  ): StudentDTO {
    return {
      id: data.userId,
      name: data.userInInstance.user.name,
      email: data.userInInstance.user.email,
      joined: data.userInInstance.joined,
      level: data.studentLevel,
      latestSubmission: data.latestSubmissionDateTime ?? undefined,
      flags: data.studentFlags.map((f) => f.flag),
    };
  }

  public static toReaderDTO(
    data: DB_ReaderDetails & {
      userInInstance: DB_UserInInstance & { user: DB_User };
    },
  ): ReaderDTO {
    return {
      id: data.userId,
      name: data.userInInstance.user.name,
      email: data.userInInstance.user.email,
      joined: data.userInInstance.joined,
      allocationLowerBound: data.projectAllocationLowerBound,
      allocationTarget: data.projectAllocationTarget,
      allocationUpperBound: data.projectAllocationUpperBound,
    };
  }

  public static toSupervisorDTO(
    data: DB_SupervisorDetails & {
      userInInstance: DB_UserInInstance & { user: DB_User };
    },
  ): SupervisorDTO {
    return {
      id: data.userId,
      name: data.userInInstance.user.name,
      email: data.userInInstance.user.email,
      joined: data.userInInstance.joined,
      allocationLowerBound: data.projectAllocationLowerBound,
      allocationTarget: data.projectAllocationTarget,
      allocationUpperBound: data.projectAllocationUpperBound,
    };
  }

  public static toProjectDTO(
    data: DB_Project & {
      flagsOnProject: (DB_FlagOnProject & { flag: DB_Flag })[];
      tagsOnProject: (DB_TagOnProject & { tag: DB_Tag })[];
    },
  ): ProjectDTO {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      specialTechnicalRequirements:
        data.specialTechnicalRequirements ?? undefined,
      preAllocatedStudentId: data.preAllocatedStudentId ?? undefined,
      latestEditDateTime: data.latestEditDateTime,
      capacityLowerBound: data.capacityLowerBound,
      capacityUpperBound: data.capacityUpperBound,
      supervisorId: data.supervisorId,
      flags: data.flagsOnProject.map((f) => this.toFlagDTO(f.flag)),
      tags: data.tagsOnProject.map((t) => this.toTagDTO(t.tag)),
    };
  }

  public static toTagDTO(data: DB_Tag): TagDTO {
    return { id: data.id, title: data.title };
  }

  public static toFlagDTO(data: DB_Flag): FlagDTO {
    return { id: data.id, title: data.title, description: data.description };
  }

  public static toAlgorithmDTO(a: DB_Algorithm): AlgorithmDTO {
    return {
      id: a.id,
      displayName: a.displayName,
      description: a.description ?? undefined,
      createdAt: a.createdAt,
      flag1: a.flag1,
      flag2: a.flag2 ?? undefined,
      flag3: a.flag3 ?? undefined,
      maxRank: a.maxRank,
      targetModifier: a.targetModifier,
      upperBoundModifier: a.upperBoundModifier,
    };
  }

  public static toGradedSubmissionDTO(
    data: DB_GradedSubmission,
  ): GradedSubmissionDTO {
    return {
      id: data.id,
      title: data.title,
      flagId: data.flagId,
      weight: data.weight,
      deadline: data.deadline,
    };
  }
}
