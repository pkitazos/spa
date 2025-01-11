import { AllocationInstance } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import {
  GroupParams,
  InstanceParams,
  SubGroupParams,
} from "@/lib/validations/params";

import {
  GroupDTO,
  InstanceDTO,
  SubGroupDTO,
  UserDTO,
} from "@/server/routers/user/dto";

import { DB } from "@/db";

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
  };

  public user = {
    isInstanceStudent: async (
      userId: string,
      params: InstanceParams,
    ): Promise<boolean> =>
      !!(await this.db.studentDetails.findFirst({
        where: { ...expand(params), userId },
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
}

const allocationInstanceToDTO = (x: AllocationInstance) => ({
  group: x.allocationGroupId,
  subGroup: x.allocationSubGroupId,
  instance: x.id,
  ...x,
});
