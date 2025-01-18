import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { slugify } from "@/lib/utils/general/slugify";
import {
  GroupParams,
  InstanceParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import {
  allocationGroupToDTO,
  allocationInstanceToDTO,
  allocationSubGroupToDTO,
  flagToDTO,
  projectDataToDTO,
  studentDetailsToDto,
  studentToDTO,
  tagToDTO,
  userInInstanceToDTO,
} from "@/db/transformers";
import { DB } from "@/db/types";
import {
  GroupDTO,
  InstanceDTO,
  SubGroupDTO,
  UserDTO,
  UserInInstanceDTO,
} from "@/dto";
import { ProjectDTO } from "@/dto/project";
import { StudentDetailsDTO, StudentDTO } from "@/dto/student";
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
    create: async (groupName: string): Promise<GroupDTO> =>
      await this.db.allocationGroup
        .create({
          data: {
            id: slugify(groupName),
            displayName: groupName,
          },
        })
        .then(allocationGroupToDTO),

    exists: async ({ group: id }: GroupParams): Promise<boolean> =>
      !!(await this.db.allocationGroup.findFirst({ where: { id } })),

    get: async ({ group: id }: GroupParams): Promise<GroupDTO> =>
      await this.db.allocationGroup
        .findFirstOrThrow({ where: { id } })
        .then(allocationGroupToDTO),

    getAll: async (): Promise<GroupDTO[]> =>
      await this.db.allocationGroup
        .findMany()
        .then((data) => data.map(allocationGroupToDTO)),

    getSubGroups: async ({
      group: allocationGroupId,
    }: GroupParams): Promise<SubGroupDTO[]> => {
      return await this.db.allocationSubGroup
        .findMany({
          where: { allocationGroupId },
        })
        .then((data) => data.map(allocationSubGroupToDTO));
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
        .then(allocationGroupToDTO),

    delete: async ({ group: id }: GroupParams): Promise<GroupDTO> =>
      await this.db.allocationGroup
        .delete({ where: { id } })
        .then(allocationGroupToDTO),
  };

  public subGroup = {
    create: async (
      allocationGroupId: string,
      displayName: string,
    ): Promise<SubGroupDTO> =>
      this.db.allocationSubGroup
        .create({
          data: {
            displayName,
            id: slugify(displayName),
            allocationGroupId,
          },
        })
        .then(allocationSubGroupToDTO),

    exists: async (params: SubGroupParams): Promise<boolean> =>
      !!(await this.db.allocationSubGroup.findFirst({
        where: {
          allocationGroupId: params.group,
          id: params.subGroup,
        },
      })),

    get: async (params: SubGroupParams): Promise<SubGroupDTO> =>
      await this.db.allocationSubGroup
        .findFirstOrThrow({
          where: {
            allocationGroupId: params.group,
            id: params.subGroup,
          },
        })
        .then(allocationSubGroupToDTO),

    delete: async ({ group, subGroup }: SubGroupParams): Promise<SubGroupDTO> =>
      await this.db.allocationSubGroup
        .delete({
          where: {
            subGroupId: {
              allocationGroupId: group,
              id: subGroup,
            },
          },
        })
        .then(allocationSubGroupToDTO),
  };

  public instance = {
    exists: async (params: InstanceParams): Promise<boolean> =>
      !!(await this.db.allocationInstance.findFirst({ where: expand(params) })),

    get: async (params: InstanceParams): Promise<InstanceDTO> =>
      await this.db.allocationInstance
        .findFirstOrThrow({ where: expand(params) })
        .then(allocationInstanceToDTO),

    getAll: async (): Promise<InstanceDTO[]> =>
      await this.db.allocationInstance
        .findMany()
        .then((data) => data.map(allocationInstanceToDTO)),

    getForGroups: async (groups: GroupParams[]): Promise<InstanceDTO[]> =>
      await this.db.allocationInstance
        .findMany({
          where: {
            allocationGroupId: { in: groups.map((g) => g.group) },
          },
        })
        .then((data) => data.map(allocationInstanceToDTO)),

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
        .then((data) => data.map(allocationInstanceToDTO)),

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

    get: async (id: string): Promise<UserDTO> =>
      await this.db.user.findFirstOrThrow({ where: { id } }),

    joinInstance: async (
      userId: string,
      params: InstanceParams,
    ): Promise<UserInInstanceDTO> =>
      await this.db.userInInstance
        .update({
          where: { instanceMembership: { ...expand(params), userId } },
          data: { joined: true },
        })
        .then(userInInstanceToDTO),
  };

  public superAdmin = {
    getAll: async (): Promise<UserDTO[]> =>
      await this.db.superAdmin
        .findMany({ select: { user: true } })
        .then((data) => data.map((x) => x.user)),
  };

  public groupAdmin = {
    getAllGroups: async (userId: string): Promise<GroupDTO[]> =>
      await this.db.groupAdmin
        .findMany({
          where: { userId },
          select: { allocationGroup: true },
        })
        .then((data) =>
          data.map((x) => allocationGroupToDTO(x.allocationGroup)),
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
          data.map((x) => allocationSubGroupToDTO(x.allocationSubGroup)),
        ),
  };

  public student = {
    get: async (userId: string, params: InstanceParams): Promise<StudentDTO> =>
      await this.db.studentDetails
        .findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: { userInInstance: { include: { user: true } } },
        })
        .then(studentToDTO),

    getDetails: async (
      userId: string,
      params: InstanceParams,
    ): Promise<StudentDetailsDTO> =>
      await this.db.studentDetails
        .findFirstOrThrow({ where: { userId, ...expand(params) } })
        .then(studentDetailsToDto),

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
          include: { project: { include: { details: true } } },
        })
        .then((x) => ({
          project: projectDataToDTO(x.project),
          studentRanking: x.studentRanking,
        })),

    getStudentDetails: async (
      userId: string,
      params: InstanceParams,
    ): Promise<StudentDetailsDTO> =>
      await this.db.studentDetails
        .findFirstOrThrow({ where: { userId, ...expand(params) } })
        .then(studentDetailsToDto),

    setStudentLevel: async (
      userId: string,
      level: number,
      params: InstanceParams,
    ): Promise<StudentDetailsDTO> =>
      await this.db.studentDetails
        .update({
          where: { studentDetailsId: { userId, ...expand(params) } },
          data: { studentLevel: level },
        })
        .then(studentDetailsToDto),

    setLatestSubmissionDateTime: async (
      userId: string,
      latestSubmissionDateTime: Date,
      params: InstanceParams,
    ): Promise<StudentDetailsDTO> =>
      await this.db.studentDetails
        .update({
          where: { studentDetailsId: { userId, ...expand(params) } },
          data: { latestSubmissionDateTime },
        })
        .then(studentDetailsToDto),

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

    // TODO: change output type to ProjectData (see EOF)
    getInstanceData: async (userId: string, params: InstanceParams) => {
      const { projects: projectData, ...supervisorData } =
        await this.db.supervisorDetails.findFirstOrThrow({
          where: { userId, ...expand(params) },
          include: {
            userInInstance: { include: { user: true } },
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

      const projects = projectData.map((data) => ({
        project: projectDataToDTO(data),
        // TODO remove below
        ...projectDataToDTO(data),
        allocatedStudents: data.studentAllocations.map((u) => ({
          level: u.student.studentLevel,
          ...u.student.userInInstance.user,
        })),
        flags: data.details.flagsOnProject.map((f) => flagToDTO(f.flag)),
        tags: data.details.tagsOnProject.map((t) => tagToDTO(t.tag)),
      }));

      return {
        projects,
        supervisor: {
          ...supervisorData.userInInstance.user,
          projectTarget: supervisorData.projectAllocationTarget,
          projectUpperQuota: supervisorData.projectAllocationUpperBound,
        },
      };
    },

    // TODO: rename
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
