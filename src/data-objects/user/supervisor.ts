import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import { SupervisorDTO, UserDTO, ProjectDTO, StudentDTO } from "@/dto";
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import { Marker } from ".";

export class Supervisor extends Marker {
  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id, params);
  }

  public async toDTO(): Promise<SupervisorDTO> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: { userInInstance: { include: { user: true } } },
      })
      .then(T.toSupervisorDTO);
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
    { project: ProjectDTO; student: StudentDTO; rank: number }[]
  > {
    return await this.db.studentProjectAllocation
      .findMany({
        where: {
          project: { supervisorId: this.id },
          ...expand(this.instance.params),
        },
        include: {
          project: {
            include: {
              tagsOnProject: { include: { tag: true } },
              flagsOnProject: { include: { flag: true } },
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
  }

  public async getCapacityDetails(): Promise<{
    projectTarget: number;
    projectUpperQuota: number;
  }> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
      })
      .then((x) => ({
        projectTarget: x.projectAllocationTarget,
        projectUpperQuota: x.projectAllocationUpperBound,
      }));
  }

  public async getProjects(): Promise<
    { project: ProjectDTO; allocatedStudents: StudentDTO[] }[]
  > {
    const projectData = await this.db.project.findMany({
      where: { supervisorId: this.id, ...expand(this.instance.params) },
      include: {
        tagsOnProject: { include: { tag: true } },
        flagsOnProject: { include: { flag: true } },
        studentAllocations: {
          include: {
            student: {
              include: {
                studentFlags: { include: { flag: true } },
                userInInstance: { include: { user: true } },
              },
            },
          },
        },
      },
    });

    return projectData.map((x) => ({
      project: T.toProjectDTO(x),
      allocatedStudents: x.studentAllocations.map((s) =>
        T.toStudentDTO(s.student),
      ),
    }));
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
              tagsOnProject: { include: { tag: true } },
              flagsOnProject: { include: { flag: true } },
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
      flags: data.flagsOnProject.map((f) => T.toFlagDTO(f.flag)),
      tags: data.tagsOnProject.map((t) => T.toTagDTO(t.tag)),
    }));
  }

  // Probably a bad access path
  public async countAllocationsInParent(parentInstanceId: string) {
    const parentInstanceParams = {
      ...this.instance.params,
      instance: parentInstanceId,
    };

    return await new Supervisor(this.db, this.id, parentInstanceParams)
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
  }: {
    projectTarget: number;
    projectUpperQuota: number;
  }): Promise<{ projectTarget: number; projectUpperQuota: number }> {
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
