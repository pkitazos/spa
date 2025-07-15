// MOVE these to some other file

import {
  AssessmentCriterionDTO,
  CriterionScoreDTO,
  MarkingSubmissionDTO,
  UnitOfAssessmentDTO,
  UserDTO,
} from "@/dto";
import {
  DB_Algorithm,
  DB_AllocationGroup,
  DB_AllocationInstance,
  DB_AllocationSubGroup,
  DB_AssessmentCriterion,
  DB_Flag,
  DB_FlagOnProject,
  DB_FlagOnStudent,
  DB_UnitOfAssessment,
  DB_Project,
  DB_ReaderDetails,
  DB_StudentDetails,
  DB_SupervisorDetails,
  DB_Tag,
  DB_TagOnProject,
  DB_User,
  DB_UserInInstance,
  DB_CriterionScore,
  DB_MarkingSubmission,
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
          [val.assessmentCriterionId]: this.toScoreDTO(val),
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
      flags: data.flagsOnProject.map((f) => Transformers.toFlagDTO(f.flag)),
      tags: data.tagsOnProject.map((t) => Transformers.toTagDTO(t.tag)),
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
      builtIn: a.builtIn,
    };
  }

  public static toAssessmentCriterionDTO(
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
    data: DB_UnitOfAssessment & {
      flag: DB_Flag;
      assessmentCriteria: DB_AssessmentCriterion[];
    },
  ): UnitOfAssessmentDTO {
    return {
      id: data.id,
      title: data.title,
      flag: Transformers.toFlagDTO(data.flag),
      components: data.assessmentCriteria.map(
        Transformers.toAssessmentCriterionDTO,
      ),
      studentSubmissionDeadline: data.studentSubmissionDeadline,
      markerSubmissionDeadline: data.markerSubmissionDeadline,
      weight: data.weight,
      isOpen: data.open,
      allowedMarkerTypes: data.allowedMarkerTypes,
    };
  }

  public static toGroupDTO(group: DB_AllocationGroup): GroupDTO {
    return { group: group.id, displayName: group.displayName };
  }

  public static toSubGroupDTO(subGroup: DB_AllocationSubGroup): SubGroupDTO {
    return {
      group: subGroup.allocationGroupId,
      subGroup: subGroup.id,
      displayName: subGroup.displayName,
    };
  }
}
