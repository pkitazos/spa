/* eslint-disable simple-import-sort/imports */
import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { slugify } from "@/lib/utils/general/slugify";
import {
  GroupParams,
  InstanceParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { Transformers as T } from "@/db/transformers";
import { DB, PreferenceType, Stage } from "@/db/types";
import {
  GroupDTO,
  InstanceDTO,
  InstanceUserDTO,
  SubGroupDTO,
  SupervisorDTO,
  UserDTO,
  ProjectDTO,
  StudentDTO,
  InstanceDisplayData,
} from "@/dto";

import { sortPreferenceType } from "@/lib/utils/sorting/by-preference-type";
import { updateManyPreferenceTransaction } from "@/db/transactions/update-many-preferences";
import { updatePreferenceTransaction } from "@/db/transactions/update-preference";

export type DEPR_SupervisorCapacityDetails = {
  projectTarget: number;
  projectUpperQuota: number;
};

export class DAL {
  db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  public group = {
    create: async (groupName: string): Promise<GroupDTO> =>
      await this.db.allocationGroup
        .create({ data: { id: slugify(groupName), displayName: groupName } })
        .then(T.toAllocationGroupDTO),

    exists: async ({ group: id }: GroupParams): Promise<boolean> =>
      !!(await this.db.allocationGroup.findFirst({ where: { id } })),

    get: async ({ group: id }: GroupParams): Promise<GroupDTO> =>
      await this.db.allocationGroup
        .findFirstOrThrow({ where: { id } })
        .then(T.toAllocationGroupDTO),

    getAll: async (): Promise<GroupDTO[]> =>
      await this.db.allocationGroup
        .findMany()
        .then((data) => data.map(T.toAllocationGroupDTO)),

    getSubGroups: async ({
      group: allocationGroupId,
    }: GroupParams): Promise<SubGroupDTO[]> => {
      return await this.db.allocationSubGroup
        .findMany({ where: { allocationGroupId } })
        .then((data) => data.map(T.toAllocationSubGroupDTO));
    },

    getAdmins: async ({ group }: GroupParams): Promise<UserDTO[]> => {
      return await this.db.groupAdmin
        .findMany({
          where: { allocationGroupId: group },
          select: { user: true },
        })
        .then((data) => data.map((x) => x.user));
    },

    setName: async (
      { group: id }: GroupParams,
      newName: string,
    ): Promise<GroupDTO> =>
      await this.db.allocationGroup
        .update({ where: { id }, data: { displayName: newName } })
        .then(T.toAllocationGroupDTO),

    delete: async ({ group: id }: GroupParams): Promise<GroupDTO> =>
      await this.db.allocationGroup
        .delete({ where: { id } })
        .then(T.toAllocationGroupDTO),
  };

  public subGroup = {
    create: async (
      allocationGroupId: string,
      displayName: string,
    ): Promise<SubGroupDTO> =>
      this.db.allocationSubGroup
        .create({
          data: { displayName, id: slugify(displayName), allocationGroupId },
        })
        .then(T.toAllocationSubGroupDTO),

    exists: async (params: SubGroupParams): Promise<boolean> =>
      !!(await this.db.allocationSubGroup.findFirst({
        where: { allocationGroupId: params.group, id: params.subGroup },
      })),

    get: async (params: SubGroupParams): Promise<SubGroupDTO> =>
      await this.db.allocationSubGroup
        .findFirstOrThrow({
          where: { allocationGroupId: params.group, id: params.subGroup },
        })
        .then(T.toAllocationSubGroupDTO),

    getInstances: async (params: SubGroupParams): Promise<InstanceDTO[]> =>
      await this.db.allocationInstance
        .findMany({
          where: {
            allocationGroupId: params.group,
            allocationSubGroupId: params.subGroup,
          },
        })
        .then((data) => data.map(T.toAllocationInstanceDTO)),

    getAdmins: async (params: SubGroupParams): Promise<UserDTO[]> =>
      this.db.subGroupAdmin
        .findMany({
          where: {
            allocationGroupId: params.group,
            allocationSubGroupId: params.subGroup,
          },
          select: { user: true },
        })
        .then((data) => data.map((x) => x.user)),

    delete: async ({ group, subGroup }: SubGroupParams): Promise<SubGroupDTO> =>
      await this.db.allocationSubGroup
        .delete({
          where: { subGroupId: { allocationGroupId: group, id: subGroup } },
        })
        .then(T.toAllocationSubGroupDTO),
  };

  public instance = {
    exists: async (params: InstanceParams): Promise<boolean> =>
      !!(await this.db.allocationInstance.findFirst({ where: expand(params) })),

    get: async (params: InstanceParams): Promise<InstanceDTO> =>
      await this.db.allocationInstance
        .findFirstOrThrow({ where: expand(params) })
        .then(T.toAllocationInstanceDTO),

    getAll: async (): Promise<InstanceDTO[]> =>
      await this.db.allocationInstance
        .findMany()
        .then((data) => data.map(T.toAllocationInstanceDTO)),

    getForGroups: async (groups: GroupParams[]): Promise<InstanceDTO[]> =>
      await this.db.allocationInstance
        .findMany({
          where: { allocationGroupId: { in: groups.map((g) => g.group) } },
        })
        .then((data) => data.map(T.toAllocationInstanceDTO)),

    getForSubGroups: async (
      subgroups: SubGroupParams[],
    ): Promise<InstanceDTO[]> =>
      await this.db.allocationInstance
        .findMany({
          where: {
            OR: subgroups.map((x) => ({
              allocationGroupId: x.group,
              allocationSubGroupId: x.subGroup,
            })),
          },
        })
        .then((data) => data.map(T.toAllocationInstanceDTO)),

    getSupervisors: async (
      params: InstanceParams,
    ): Promise<SupervisorDTO[]> => {
      const supervisors = await this.db.supervisorDetails.findMany({
        where: expand(params),
        include: { userInInstance: { include: { user: true } } },
      });

      return supervisors.map(T.toSupervisorDTO);
    },

    getSupervisorDetails: async (params: InstanceParams) => {
      const supervisors = await this.db.supervisorDetails.findMany({
        where: expand(params),
        include: { userInInstance: { include: { user: true } } },
      });

      return supervisors.map(({ userInInstance, ...s }) => ({
        institutionId: userInInstance.user.id,
        fullName: userInInstance.user.name,
        email: userInInstance.user.email,
        joined: userInInstance.joined,
        projectTarget: s.projectAllocationTarget,
        projectUpperQuota: s.projectAllocationUpperBound,
      }));
    },

    getFlags: async (params: InstanceParams) =>
      await this.db.flag.findMany({ where: expand(params) }),

    getTags: async (params: InstanceParams) =>
      await this.db.tag.findMany({ where: expand(params) }),

    toQualifiedPaths: async (
      instances: InstanceParams[],
    ): Promise<InstanceDisplayData[]> =>
      await this.db.allocationInstance
        .findMany({
          where: { OR: instances.map((x) => toInstanceId(x)) },
          select: {
            displayName: true,
            id: true,
            allocationSubGroup: {
              select: {
                displayName: true,
                id: true,
                allocationGroup: { select: { displayName: true, id: true } },
              },
            },
          },
        })
        .then((data) =>
          data.map((x) => ({
            group: {
              id: x.allocationSubGroup.allocationGroup.id,
              displayName: x.allocationSubGroup.allocationGroup.displayName,
            },
            subGroup: {
              id: x.allocationSubGroup.id,
              displayName: x.allocationSubGroup.displayName,
            },
            instance: { id: x.id, displayName: x.displayName },
          })),
        ),

    setStage: async (params: InstanceParams, stage: Stage) => {
      this.db.allocationInstance.update({
        where: {
          instanceId: {
            allocationGroupId: params.group,
            allocationSubGroupId: params.subGroup,
            id: params.instance,
          },
        },
        data: { stage },
      });
    },

    setSupervisorProjectAllocationAccess: async (
      access: boolean,
      params: InstanceParams,
    ): Promise<boolean> => {
      await this.db.allocationInstance.update({
        where: { instanceId: toInstanceId(params) },
        data: { supervisorAllocationAccess: access },
      });
      return access;
    },

    delete: async (params: InstanceParams) =>
      await this.db.allocationInstance.delete({
        where: {
          instanceId: {
            id: params.instance,
            allocationSubGroupId: params.subGroup,
            allocationGroupId: params.group,
          },
        },
      }),
  };

  public project = {
    exists: async ({ projectId, ...params }: ProjectParams) =>
      !!(await this.db.projectInInstance.findFirst({
        where: { projectId, ...expand(params) },
      })),
  };

  public algorithm = {
    get: async (id: string) =>
      await this.db.algorithmConfig.findFirstOrThrow({ where: { id } }),
  };

  public user = {
    exists: async (userId: string): Promise<boolean> =>
      !!(await this.db.user.findFirst({ where: { id: userId } })),

    isSuperAdmin: async (userId: string): Promise<boolean> =>
      !!(await this.db.superAdmin.findFirst({ where: { userId } })),

    isGroupAdmin: async (
      userId: string,
      groupParams: GroupParams,
    ): Promise<boolean> =>
      !!(await this.db.groupAdmin.findFirst({
        where: { userId, allocationGroupId: groupParams.group },
      })),

    isSubGroupAdmin: async (
      userId: string,
      subGroupParams: SubGroupParams,
    ): Promise<boolean> =>
      !!(await this.db.subGroupAdmin.findFirst({
        where: {
          userId,
          allocationSubGroupId: subGroupParams.subGroup,
          allocationGroupId: subGroupParams.group,
        },
      })),

    isInstanceStudent: async (
      userId: string,
      params: InstanceParams,
    ): Promise<boolean> =>
      !!(await this.db.studentDetails.findFirst({
        where: { ...expand(params), userId },
      })),

    isInstanceSupervisor: async (
      userId: string,
      params: InstanceParams,
    ): Promise<boolean> =>
      !!(await this.db.supervisorDetails.findFirst({
        where: { ...expand(params), userId },
      })),

    isInstanceReader: async (
      userId: string,
      params: InstanceParams,
    ): Promise<boolean> =>
      !!(await this.db.readerDetails.findFirst({
        where: { ...expand(params), userId },
      })),

    isProjectSupervisor: async (
      userId: string,
      { projectId, ...params }: ProjectParams,
    ): Promise<boolean> =>
      !!(await this.db.projectInInstance.findFirst({
        where: { projectId, ...expand(params), supervisorId: userId },
      })),

    isProjectReader: async (
      userId: string,
      { projectId, ...params }: ProjectParams,
    ): Promise<boolean> =>
      !!(await this.db.readerProjectAllocation.findFirst({
        where: { projectId, ...expand(params), userId },
      })),

    getManagedGroups: async (
      userId: string,
    ): Promise<{ displayName: string; path: string }[]> =>
      await this.db.groupAdmin
        .findMany({ where: { userId }, select: { allocationGroup: true } })
        .then((data) =>
          data.map((x) => ({
            displayName: x.allocationGroup.displayName,
            path: `/${x.allocationGroup.id}`,
          })),
        ),

    getManagedSubGroups: async (
      userId: string,
    ): Promise<{ displayName: string; path: string }[]> =>
      this.db.subGroupAdmin
        .findMany({
          where: { userId },
          select: { allocationGroup: true, allocationSubGroup: true },
        })
        .then((data) =>
          data.map((x) => ({
            displayName: x.allocationSubGroup.displayName,
            path: `/${x.allocationGroup.id}/${x.allocationSubGroup.id}`,
          })),
        ),

    getAllInstances: async (userId: string): Promise<InstanceDTO[]> =>
      await this.db.userInInstance
        .findMany({ where: { userId }, select: { allocationInstance: true } })
        .then((data) =>
          data.map((x) => T.toAllocationInstanceDTO(x.allocationInstance)),
        ),

    get: async (id: string): Promise<UserDTO> =>
      await this.db.user.findFirstOrThrow({ where: { id } }),

    joinInstance: async (
      userId: string,
      params: InstanceParams,
    ): Promise<InstanceUserDTO> =>
      await this.db.userInInstance
        .update({
          where: { instanceMembership: { ...expand(params), userId } },
          data: { joined: true },
          include: { user: true },
        })
        .then(T.toInstanceUserDTO),

    deleteInInstance: async (userId: string, params: InstanceParams) =>
      await this.db.userInInstance.delete({
        where: { instanceMembership: { ...expand(params), userId } },
      }),

    deleteManyInInstance: async (userIds: string[], params: InstanceParams) =>
      await this.db.userInInstance.deleteMany({
        where: { ...expand(params), userId: { in: userIds } },
      }),
  };

  public superAdmin = {
    getAll: async (): Promise<UserDTO[]> =>
      await this.db.superAdmin
        .findMany({ select: { user: true } })
        .then((data) => data.map((x) => x.user)),
  };

  public groupAdmin = {
    create: async (
      userId: string,
      groupParams: GroupParams,
    ): Promise<UserDTO> =>
      await this.db.groupAdmin
        .create({
          data: { userId, allocationGroupId: groupParams.group },
          select: { user: true },
        })
        .then((x) => x.user),

    getAllGroups: async (userId: string): Promise<GroupDTO[]> =>
      await this.db.groupAdmin
        .findMany({ where: { userId }, select: { allocationGroup: true } })
        .then((data) =>
          data.map((x) => T.toAllocationGroupDTO(x.allocationGroup)),
        ),

    getAllInstances: async (userId: string): Promise<InstanceDTO[]> =>
      await this.db.groupAdmin
        .findMany({
          where: { userId },
          select: {
            allocationGroup: {
              select: {
                allocationSubGroups: { select: { allocationInstances: true } },
              },
            },
          },
        })
        .then((data) =>
          data
            .flatMap((x) => x.allocationGroup.allocationSubGroups)
            .flatMap((x) => x.allocationInstances)
            .map(T.toAllocationInstanceDTO),
        ),
  };

  public subGroupAdmin = {
    getAllSubgroups: async (userId: string): Promise<SubGroupDTO[]> =>
      await this.db.subGroupAdmin
        .findMany({ where: { userId }, select: { allocationSubGroup: true } })
        .then((data) =>
          data.map((x) => T.toAllocationSubGroupDTO(x.allocationSubGroup)),
        ),
  };

  public student = {
    get: async (userId: string, params: InstanceParams): Promise<StudentDTO> =>
      await this.db.studentDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: {
            studentFlags: { include: { flag: true } },
            userInInstance: { include: { user: true } },
          },
        })
        .then(T.toStudentDTO),

    getDetails: async (
      userId: string,
      params: InstanceParams,
    ): Promise<StudentDTO> =>
      await this.db.studentDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: {
            studentFlags: { include: { flag: true } },
            userInInstance: { include: { user: true } },
          },
        })
        .then(T.toStudentDTO),

    hasSelfDefinedProject: async (
      preAllocatedStudentId: string,
      params: InstanceParams,
    ): Promise<boolean> =>
      !!(await this.db.projectInInstance.findFirst({
        where: { details: { preAllocatedStudentId }, ...expand(params) },
      })),

    hasAllocatedProject: async (
      userId: string,
      params: InstanceParams,
    ): Promise<boolean> =>
      !!(await this.db.studentProjectAllocation.findFirst({
        where: { userId, ...expand(params) },
      })),

    getAllocatedProject: async (
      userId: string,
      params: InstanceParams,
    ): Promise<{ project: ProjectDTO; studentRanking: number }> =>
      await this.db.studentProjectAllocation
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: {
            project: {
              include: {
                details: {
                  include: {
                    tagsOnProject: { include: { tag: true } },
                    flagsOnProject: { include: { flag: true } },
                  },
                },
              },
            },
          },
        })
        .then((x) => ({
          project: T.toProjectDTO(x.project),
          studentRanking: x.studentRanking,
        })),

    getStudentDetails: async (
      userId: string,
      params: InstanceParams,
    ): Promise<StudentDTO> =>
      await this.db.studentDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: {
            studentFlags: { include: { flag: true } },
            userInInstance: { include: { user: true } },
          },
        })
        .then(T.toStudentDTO),

    setStudentLevel: async (
      userId: string,
      level: number,
      params: InstanceParams,
    ): Promise<StudentDTO> =>
      await this.db.studentDetails
        .update({
          where: { studentDetailsId: { userId, ...expand(params) } },
          data: { studentLevel: level },
          include: {
            studentFlags: { include: { flag: true } },
            userInInstance: { include: { user: true } },
          },
        })
        .then(T.toStudentDTO),

    getDraftPreference: async (
      userId: string,
      projectId: string,
      params: InstanceParams,
    ): Promise<PreferenceType | undefined> => {
      return await this.db.studentDraftPreference
        .findFirst({
          where: { userId, projectId, ...expand(params) },
          select: { type: true },
        })
        .then((x) => x?.type);
    },

    getDraftPreferences: async (
      userId: string,
      params: InstanceParams,
    ): Promise<
      {
        project: ProjectDTO;
        score: number;
        type: PreferenceType;
        supervisor: UserDTO;
      }[]
    > => {
      return await this.db.studentDraftPreference
        .findMany({
          where: { userId, ...expand(params) },
          select: {
            type: true,
            score: true,
            project: {
              include: {
                details: {
                  include: {
                    tagsOnProject: { include: { tag: true } },
                    flagsOnProject: { include: { flag: true } },
                  },
                },
                supervisor: {
                  select: { userInInstance: { select: { user: true } } },
                },
              },
            },
          },
          orderBy: { score: "asc" },
        })
        .then((data) =>
          data
            .sort(sortPreferenceType)
            .map((x) => ({
              project: T.toProjectDTO(x.project),
              supervisor: x.project.supervisor.userInInstance.user,
              score: x.score,
              type: x.type,
            })),
        );
    },

    getSubmittedPreferences: async (
      userId: string,
      params: InstanceParams,
    ): Promise<
      { project: ProjectDTO; rank: number; supervisor: UserDTO }[]
    > => {
      return await this.db.studentDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          select: {
            studentSubmittedPreferences: {
              select: {
                project: {
                  include: {
                    details: {
                      include: {
                        tagsOnProject: { include: { tag: true } },
                        flagsOnProject: { include: { flag: true } },
                      },
                    },
                    supervisor: {
                      select: { userInInstance: { select: { user: true } } },
                    },
                  },
                },
                rank: true,
              },
              orderBy: { rank: "asc" },
            },
          },
        })
        .then((data) =>
          data.studentSubmittedPreferences.map((x) => ({
            project: T.toProjectDTO(x.project),
            rank: x.rank,
            supervisor: x.project.supervisor.userInInstance.user,
          })),
        );
    },

    setLatestSubmissionDateTime: async (
      userId: string,
      latestSubmissionDateTime: Date,
      params: InstanceParams,
    ): Promise<StudentDTO> =>
      await this.db.studentDetails
        .update({
          where: { studentDetailsId: { userId, ...expand(params) } },
          data: { latestSubmissionDateTime },
          include: {
            studentFlags: { include: { flag: true } },
            userInInstance: { include: { user: true } },
          },
        })
        .then(T.toStudentDTO),

    setDraftPreferenceType: async (
      userId: string,
      projectId: string,
      preferenceType: PreferenceType | undefined,
      params: InstanceParams,
    ): Promise<void> => {
      return updatePreferenceTransaction(this.db, {
        userId,
        projectId,
        preferenceType,
        params,
      });
    },

    setDraftPreference: async (
      userId: string,
      projectId: string,
      preferenceType: PreferenceType,
      updatedRank: number,
      params: InstanceParams,
    ): Promise<{ project: ProjectDTO; rank: number }> => {
      return await this.db.studentDraftPreference
        .update({
          where: {
            draftPreferenceId: { projectId, userId, ...expand(params) },
          },
          data: { type: preferenceType, score: updatedRank },
          include: {
            project: {
              include: {
                details: {
                  include: {
                    tagsOnProject: { include: { tag: true } },
                    flagsOnProject: { include: { flag: true } },
                  },
                },
              },
            },
          },
        })
        .then((data) => ({
          project: T.toProjectDTO(data.project),
          rank: updatedRank,
        }));
    },

    setManyDraftPreferenceTypes: async (
      userId: string,
      projectIds: string[],
      preferenceType: PreferenceType | undefined,
      params: InstanceParams,
    ): Promise<void> => {
      await updateManyPreferenceTransaction(this.db, {
        userId,
        params,
        projectIds,
        preferenceType,
      });
    },

    submitPreferences: async (userId: string, params: InstanceParams) => {
      const newSubmissionDateTime = new Date();

      await this.db.$transaction(async (tx) => {
        const preferences = await tx.studentDraftPreference.findMany({
          where: { userId, type: PreferenceType.PREFERENCE, ...expand(params) },
          select: { projectId: true, score: true },
          orderBy: { score: "asc" },
        });

        await tx.studentSubmittedPreference.deleteMany({
          where: { userId, ...expand(params) },
        });

        await tx.studentSubmittedPreference.createMany({
          data: preferences.map(({ projectId }, i) => ({
            projectId,
            rank: i + 1,
            userId,
            ...expand(params),
          })),
        });

        await tx.studentDetails.update({
          where: { studentDetailsId: { userId, ...expand(params) } },
          data: { latestSubmissionDateTime: newSubmissionDateTime },
        });
      });

      return newSubmissionDateTime;
    },

    delete: async (userId: string, params: InstanceParams): Promise<void> => {
      await this.db.studentDetails.delete({
        where: { studentDetailsId: { userId, ...expand(params) } },
      });
    },

    deleteMany: async (
      userIds: string[],
      params: InstanceParams,
    ): Promise<void> => {
      await this.db.studentDetails.deleteMany({
        where: { userId: { in: userIds }, ...expand(params) },
      });
    },
  };

  public supervisor = {
    get: async (userId: string, params: InstanceParams): Promise<UserDTO> =>
      await this.db.supervisorDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: { userInInstance: { include: { user: true } } },
        })
        .then((x) => x.userInInstance.user),

    getDetails: async (
      userId: string,
      params: InstanceParams,
    ): Promise<SupervisorDTO> =>
      await this.db.supervisorDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: { userInInstance: { include: { user: true } } },
        })
        .then(T.toSupervisorDTO),

    getInstanceData: async (userId: string, params: InstanceParams) => {
      const { projects: projectData } =
        await this.db.supervisorDetails.findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: {
            projects: {
              include: {
                studentAllocations: {
                  include: {
                    student: {
                      include: { userInInstance: { include: { user: true } } },
                    },
                  },
                },
                details: {
                  include: {
                    tagsOnProject: { include: { tag: true } },
                    flagsOnProject: { include: { flag: true } },
                  },
                },
              },
            },
          },
        });

      return projectData.map((data) => ({
        project: T.toProjectDTO(data),
        // TODO remove below
        ...T.toProjectDTO(data),
        allocatedStudents: data.studentAllocations.map((u) => ({
          level: u.student.studentLevel,
          ...u.student.userInInstance.user,
        })),
        flags: data.details.flagsOnProject.map((f) => T.toFlagDTO(f.flag)),
        tags: data.details.tagsOnProject.map((t) => T.toTagDTO(t.tag)),
      }));
    },

    getSupervisionAllocations: async (
      userId: string,
      params: InstanceParams,
    ): Promise<
      { project: ProjectDTO; student: StudentDTO; rank: number }[]
    > => {
      return await this.db.studentProjectAllocation
        .findMany({
          where: { project: { supervisorId: userId }, ...expand(params) },
          include: {
            project: {
              include: {
                details: {
                  include: {
                    tagsOnProject: { include: { tag: true } },
                    flagsOnProject: { include: { flag: true } },
                  },
                },
              },
            },
            student: {
              include: {
                studentFlags: { include: { flag: true } },
                userInInstance: { include: { user: true } },
              },
            },
          },
        })
        .then((data) =>
          data.map(({ project, student, studentRanking }) => ({
            project: T.toProjectDTO(project),
            student: T.toStudentDTO(student),
            rank: studentRanking,
          })),
        );
    },

    getCapacityDetails: async (
      userId: string,
      params: InstanceParams,
    ): Promise<DEPR_SupervisorCapacityDetails> =>
      await this.db.supervisorDetails
        .findFirstOrThrow({ where: { userId, ...expand(params) } })
        .then((x) => ({
          projectTarget: x.projectAllocationTarget,
          projectUpperQuota: x.projectAllocationUpperBound,
        })),

    setCapacityDetails: async (
      userId: string,
      { projectTarget, projectUpperQuota }: DEPR_SupervisorCapacityDetails,
      params: InstanceParams,
    ): Promise<DEPR_SupervisorCapacityDetails> => {
      await this.db.supervisorDetails.update({
        where: { supervisorDetailsId: { userId, ...expand(params) } },
        data: {
          projectAllocationTarget: projectTarget,
          projectAllocationUpperBound: projectUpperQuota,
        },
      });
      return { projectTarget, projectUpperQuota };
    },

    delete: async (userId: string, params: InstanceParams): Promise<void> => {
      await this.db.supervisorDetails.delete({
        where: { supervisorDetailsId: { userId, ...expand(params) } },
      });
    },

    deleteMany: async (
      userIds: string[],
      params: InstanceParams,
    ): Promise<void> => {
      await this.db.supervisorDetails.deleteMany({
        where: { userId: { in: userIds }, ...expand(params) },
      });
    },
  };
}

// type ProjectData = {
//   project: ProjectDTO;
//   allocatedStudents: StudentDTO[];
//   flags: FlagDTO[];
//   tags: TagDTO[];
// };
