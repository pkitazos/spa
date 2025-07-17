// MOVE these to some other file
import {
  type AssessmentCriterionDTO,
  type CriterionScoreDTO,
  type MarkingSubmissionDTO,
  type UnitOfAssessmentDTO,
  type UserDTO,
} from "@/dto";
import {
  type AlgorithmDTO,
  type FlagDTO,
  type GroupDTO,
  type InstanceDTO,
  type InstanceUserDTO,
  type ProjectDTO,
  type ReaderDTO,
  type StudentDTO,
  type SubGroupDTO,
  type SupervisorDTO,
  type TagDTO,
} from "@/dto";

import {
  type DB_Algorithm,
  type DB_AllocationGroup,
  type DB_AllocationInstance,
  type DB_AllocationSubGroup,
  type DB_AssessmentCriterion,
  type DB_Flag,
  type DB_FlagOnProject,
  type DB_FlagOnStudent,
  type DB_UnitOfAssessment,
  type DB_Project,
  type DB_ReaderDetails,
  type DB_StudentDetails,
  type DB_SupervisorDetails,
  type DB_Tag,
  type DB_TagOnProject,
  type DB_User,
  type DB_UserInInstance,
  type DB_CriterionScore,
  type DB_MarkingSubmission,
} from "./types";

export class Transformers {
  static toUserDTO({
    id,
    name,
    email,
  }: {
    id: string;
    name: string;
    email: string;
  }): UserDTO {
    return { id, name, email };
  }

  public static toMarkingSubmissionDTO(
    this: void,
    data: DB_MarkingSubmission & { criterionScores?: DB_CriterionScore[] },
  ): MarkingSubmissionDTO {
    return {
      markerId: data.markerId,
      studentId: data.studentId,
      grade: data.grade,
      unitOfAssessmentId: data.unitOfAssessmentId,
      marks: (data.criterionScores ?? []).reduce(
        (acc, val) => ({
          ...acc,
          [val.assessmentCriterionId]: Transformers.toScoreDTO(val),
        }),
        {},
      ),
      finalComment: data.summary,
      recommendation: data.recommendedForPrize,
      draft: data.draft,
    };
  }
  public static toScoreDTO(data: DB_CriterionScore): CriterionScoreDTO {
    return { mark: data.grade, justification: data.justification };
  }

  public static toAllocationGroupDTO(
    this: void,
    data: DB_AllocationGroup,
  ): GroupDTO {
    return { group: data.id, displayName: data.displayName };
  }

  public static toAllocationSubGroupDTO(
    this: void,
    data: DB_AllocationSubGroup,
  ): SubGroupDTO {
    return {
      group: data.allocationGroupId,
      subGroup: data.id,
      displayName: data.displayName,
    };
  }

  public static toAllocationInstanceDTO(
    this: void,
    data: DB_AllocationInstance,
  ): InstanceDTO {
    return {
      group: data.allocationGroupId,
      subGroup: data.allocationSubGroupId,
      instance: data.id,
      displayName: data.displayName,
      stage: data.stage,
      selectedAlgConfigId: data.selectedAlgId ?? undefined,
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
    this: void,
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
    this: void,
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
    this: void,
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
    this: void,
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
    this: void,
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
      flags: data.flagsOnProject.map((f) => Transformers.toFlagDTO(f.flag)),
      tags: data.tagsOnProject.map((t) => Transformers.toTagDTO(t.tag)),
    };
  }

  public static toTagDTO(this: void, data: DB_Tag): TagDTO {
    return { id: data.id, title: data.title };
  }

  public static toFlagDTO(this: void, data: DB_Flag): FlagDTO {
    return { id: data.id, title: data.title, description: data.description };
  }

  public static toAlgorithmDTO(this: void, a: DB_Algorithm): AlgorithmDTO {
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
      builtIn: a.builtIn,
    };
  }

  public static toAssessmentCriterionDTO(
    this: void,
    data: DB_AssessmentCriterion,
  ): AssessmentCriterionDTO {
    return {
      id: data.id,
      unitOfAssessmentId: data.unitOfAssessmentId,
      title: data.title,
      description: data.description,
      weight: data.weight,
      layoutIndex: data.layoutIndex,
    };
  }

  public static toUnitOfAssessmentDTO(
    this: void,
    data: DB_UnitOfAssessment & {
      flag: DB_Flag;
      assessmentCriteria: DB_AssessmentCriterion[];
    },
  ): UnitOfAssessmentDTO {
    return {
      id: data.id,
      title: data.title,
      flag: Transformers.toFlagDTO(data.flag),
      components: data.assessmentCriteria.map((x) =>
        Transformers.toAssessmentCriterionDTO(x),
      ),
      studentSubmissionDeadline: data.studentSubmissionDeadline,
      markerSubmissionDeadline: data.markerSubmissionDeadline,
      weight: data.weight,
      isOpen: data.open,
      allowedMarkerTypes: data.allowedMarkerTypes,
    };
  }

  public static toGroupDTO(this: void, group: DB_AllocationGroup): GroupDTO {
    return { group: group.id, displayName: group.displayName };
  }

  public static toSubGroupDTO(
    this: void,
    subGroup: DB_AllocationSubGroup,
  ): SubGroupDTO {
    return {
      group: subGroup.allocationGroupId,
      subGroup: subGroup.id,
      displayName: subGroup.displayName,
    };
  }
}
