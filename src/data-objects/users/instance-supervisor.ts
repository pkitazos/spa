import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import {
  flagToDTO,
  projectDataToDTO,
  supervisorToDTO,
  tagToDTO,
} from "@/db/transformers";
import { DB } from "@/db/types";
import { UserDTO } from "@/dto";
import {
  Project__AllocatedStudents_Capacities,
  SupervisionAllocationDto,
  SupervisorCapacityDetails,
  SupervisorDTO,
} from "@/dto/supervisor_router";

export class InstanceSupervisor extends User {
  instance: AllocationInstance;
  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id);
    this.instance = new AllocationInstance(db, params);
  }

  public async toDTO(): Promise<SupervisorDTO> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: { userInInstance: { include: { user: true } } },
      })
      .then(supervisorToDTO);
  }

  public async get(): Promise<UserDTO> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: { userInInstance: { include: { user: true } } },
      })
      .then((x) => x.userInInstance.user);
  }

  public async getSupervisionAllocations(): Promise<
    SupervisionAllocationDto[]
  > {
    return await this.db.studentProjectAllocation
      .findMany({
        where: {
          project: { supervisorId: this.id },
          ...expand(this.instance.params),
        },
        select: {
          studentRanking: true,
          project: { include: { details: true } },
          student: { include: { userInInstance: { select: { user: true } } } },
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
            level: student.studentLevel,
          },
          rank,
        })),
      );
  }

  public async getCapacityDetails(): Promise<SupervisorCapacityDetails> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
      })
      .then((x) => ({
        projectTarget: x.projectAllocationTarget,
        projectUpperQuota: x.projectAllocationUpperBound,
      }));
  }

  // TODO rename this return type
  public async getProjects(): Promise<Project__AllocatedStudents_Capacities[]> {
    return await this.db.projectInInstance
      .findMany({
        where: { supervisorId: this.id, ...expand(this.instance.params) },
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
  }

  public async getProjectsWithDetails() {
    const { projects: projectData } =
      await this.db.supervisorDetails.findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
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
  }

  // Probably a bad access path
  public async countAllocationsInParent(parentInstanceId: string) {
    const parentInstanceParams = {
      ...this.instance.params,
      instance: parentInstanceId,
    };

    return await new InstanceSupervisor(this.db, this.id, parentInstanceParams)
      .getSupervisionAllocations()
      .then((allocations) => allocations.length);
  }

  public async countAllocations() {
    return await this.getSupervisionAllocations().then(
      (allocations) => allocations.length,
    );
  }

  public async setCapacityDetails({
    projectTarget,
    projectUpperQuota,
  }: SupervisorCapacityDetails): Promise<SupervisorCapacityDetails> {
    await this.db.supervisorDetails.update({
      where: {
        supervisorDetailsId: {
          userId: this.id,
          ...expand(this.instance.params),
        },
      },
      data: {
        projectAllocationTarget: projectTarget,
        projectAllocationUpperBound: projectUpperQuota,
      },
    });
    return { projectTarget, projectUpperQuota };
  }
}
