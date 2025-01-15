import { AllocationInstance, Stage } from "@prisma/client";

import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import {
  GroupParams,
  InstanceParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { DB } from "@/db";
import { GroupDTO, InstanceDTO, SubGroupDTO, UserDTO } from "@/dto";
import {
  Project__AllocatedStudents_Capacities,
  SupervisionAllocationDto,
  SupervisorCapacityDetails,
} from "@/dto/supervisor_router";

export class DAL {
  db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  public group = {
    exists: async ({ group: id }: GroupParams): Promise<boolean> =>
      !!(await this.db.allocationGroup.findFirst({ where: { id } })),
  };

  public instance = {
    getAll: async () =>
      await this.db.allocationInstance
        .findMany()
        .then((data) => data.map(allocationInstanceToDTO)),

    getAllFrom: async (
      groups: GroupParams[],
      subgroups: SubGroupParams[],
    ): Promise<InstanceDTO[]> => {
      const p1 = await this.db.allocationInstance.findMany({
        where: {
          allocationGroupId: { in: groups.map((g) => g.group) },
        },
      });

      const p2 = await this.db.allocationInstance.findMany({
        where: {
          OR: subgroups.map((x) => ({
            allocationGroupId: x.group,
            allocationSubGroupId: x.subGroup,
          })),
        },
      });

      return [...p1, ...p2].map((x) => ({
        group: x.allocationGroupId,
        subGroup: x.allocationSubGroupId,
        instance: x.id,
        ...x,
      }));
    },

    getParentInstanceId: async (
      params: InstanceParams,
    ): Promise<string | undefined> => {
      return await this.db.allocationInstance
        .findFirstOrThrow({
          where: toInstanceId(params),
          select: { parentInstanceId: true },
        })
        .then((x) => x.parentInstanceId ?? undefined);
    },

    isForked: async (params: InstanceParams): Promise<boolean> =>
      !!(await this.db.allocationInstance.findFirst({
        where: { ...toInstanceId(params), parentInstanceId: { not: null } },
      })),

    getStage: async (params: InstanceParams): Promise<Stage> =>
      await this.db.allocationInstance
        .findFirstOrThrow({
          where: toInstanceId(params),
          select: { stage: true },
        })
        .then((x) => x.stage),

    getSupervisorProjectAllocationAccess: async (
      params: InstanceParams,
    ): Promise<boolean> =>
      await this.db.allocationInstance
        .findFirstOrThrow({
          where: toInstanceId(params),
          select: { supervisorAllocationAccess: true },
        })
        .then((x) => x.supervisorAllocationAccess),

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
  };

  public user = {
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

    getAllInstances: async (userId: string): Promise<InstanceDTO[]> =>
      await this.db.userInInstance
        .findMany({
          where: { userId },
          select: { allocationInstance: true },
        })
        .then((data) =>
          data.map((x) => allocationInstanceToDTO(x.allocationInstance)),
        ),

    getDetails: async (id: string): Promise<UserDTO> =>
      await this.db.user.findFirstOrThrow({
        where: { id },
        select: { id: true, name: true, email: true },
      }),

    joinInstance: async (userId: string, params: InstanceParams) =>
      await this.db.userInInstance.update({
        where: { instanceMembership: { ...expand(params), userId } },
        data: { joined: true },
      }),
  };

  public groupAdmin = {
    getAllGroups: async (userId: string): Promise<GroupDTO[]> =>
      await this.db.groupAdmin
        .findMany({
          where: { userId },
          select: { allocationGroup: true },
        })
        .then((data) =>
          data.map((x) => ({
            group: x.allocationGroup.id,
            ...x.allocationGroup,
          })),
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
            .map(allocationInstanceToDTO),
        ),
  };

  public subGroupAdmin = {
    getAllSubgroups: async (userId: string): Promise<SubGroupDTO[]> =>
      await this.db.subGroupAdmin
        .findMany({
          where: { userId },
          select: { allocationSubGroup: true },
        })
        .then((data) =>
          data.map((x) => ({
            group: x.allocationSubGroup.allocationGroupId,
            subGroup: x.allocationSubGroup.id,
            ...x.allocationSubGroup,
          })),
        ),
  };

  public student = {
    hasSelfDefinedProject: async (
      preAllocatedStudentId: string,
      params: InstanceParams,
    ): Promise<boolean> => {
      return !!(await this.db.projectInInstance.findFirst({
        where: {
          ...expand(params),
          details: { preAllocatedStudentId },
        },
      }));
    },
  };

  public supervisor = {
    exists: async (userId: string, params: InstanceParams): Promise<boolean> =>
      !!(await this.db.supervisorDetails.findFirst({
        where: { userId, ...expand(params) },
      })),

    delete: async (userId: string, params: InstanceParams) => {
      await this.db.supervisorDetails.delete({
        where: { supervisorDetailsId: { userId, ...expand(params) } },
      });
    },

    deleteMany: async (userIds: string[], params: InstanceParams) => {
      await this.db.supervisorDetails.deleteMany({
        where: { userId: { in: userIds }, ...expand(params) },
      });
    },

    // ! bad name because it includes allocated students
    getAllProjects: async (
      userId: string,
      params: InstanceParams,
    ): Promise<Project__AllocatedStudents_Capacities[]> => {
      return await this.db.projectInInstance
        .findMany({
          where: { supervisorId: userId, ...expand(params) },
          select: {
            projectId: true,
            supervisorId: true,
            details: true,
            studentAllocations: {
              select: {
                student: {
                  select: { userInInstance: { select: { user: true } } },
                },
              },
            },
          },
        })
        .then((data) =>
          data.map((x) => ({
            id: x.projectId,
            title: x.details.title,
            supervisorId: x.supervisorId,
            capacityLowerBound: x.details.capacityLowerBound,
            capacityUpperBound: x.details.capacityUpperBound,
            preAllocatedStudentId: x.details.preAllocatedStudentId ?? undefined,
            allocatedStudents: x.studentAllocations.map(
              (y) => y.student.userInInstance.user,
            ),
          })),
        );
    },

    getSupervisionAllocations: async (
      userId: string,
      params: InstanceParams,
    ): Promise<SupervisionAllocationDto[]> => {
      return await this.db.studentProjectAllocation
        .findMany({
          where: { project: { supervisorId: userId }, ...expand(params) },
          select: {
            studentRanking: true,
            project: { include: { details: true } },
            student: {
              include: { userInInstance: { select: { user: true } } },
            },
          },
        })
        .then((data) =>
          data.map(({ project, student, studentRanking: rank }) => ({
            project: {
              ...project,
              ...project.details,
              preAllocatedStudentId:
                project.details.preAllocatedStudentId ?? undefined,
            },
            student: {
              ...student.userInInstance.user,
              rank,
              level: student.studentLevel,
            },
          })),
        );
    },

    getCapacityDetails: async (
      userId: string,
      params: InstanceParams,
    ): Promise<SupervisorCapacityDetails> =>
      await this.db.supervisorDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
        })
        .then((x) => ({
          projectTarget: x.projectAllocationTarget,
          projectUpperQuota: x.projectAllocationUpperBound,
        })),

    setCapacityDetails: async (
      userId: string,
      { projectTarget, projectUpperQuota }: SupervisorCapacityDetails,
      params: InstanceParams,
    ): Promise<SupervisorCapacityDetails> => {
      await this.db.supervisorDetails.update({
        where: { supervisorDetailsId: { userId, ...expand(params) } },
        data: {
          projectAllocationTarget: projectTarget,
          projectAllocationUpperBound: projectUpperQuota,
        },
      });
      return { projectTarget, projectUpperQuota };
    },
  };
}

const allocationInstanceToDTO = (x: AllocationInstance) => ({
  group: x.allocationGroupId,
  subGroup: x.allocationSubGroupId,
  instance: x.id,
  ...x,
});
