import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { DB, MarkerType } from "@/db/types";
import { ProjectDTO, StudentDTO } from "@/dto";
import { GradedSubmissionDTO } from "@/dto/marking";
import { Transformers as T } from "@/db/transformers";

export class Marker extends User {
  instance: AllocationInstance;

  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id);
    this.instance = new AllocationInstance(db, params);
  }

  public async getProjectsWithSubmissions(): Promise<
    {
      project: ProjectDTO;
      student: StudentDTO;
      markerType: MarkerType;
      gradedSubmissions: GradedSubmissionDTO[];
    }[]
  > {
    const assignedProjects: {
      project: ProjectDTO;
      student: StudentDTO;
      markerType: MarkerType;
      gradedSubmissions: GradedSubmissionDTO[];
    }[] = [];

    if (await this.isSupervisor(this.instance.params)) {
      const data = await this.db.studentProjectAllocation.findMany({
        where: { project: { supervisorId: this.id } },
        include: {
          student: {
            include: {
              userInInstance: { include: { user: true } },
              studentFlags: {
                include: { flag: { include: { gradedSubmissions: true } } },
              },
            },
          },
          project: {
            include: {
              flagsOnProject: { include: { flag: true } },
              tagsOnProject: { include: { tag: true } },
            },
          },
        },
      });

      assignedProjects.push(
        ...data.flatMap((a) =>
          a.student.studentFlags.flatMap((f) => ({
            project: T.toProjectDTO(a.project),
            student: T.toStudentDTO(a.student),
            markerType: MarkerType.SUPERVISOR,
            gradedSubmissions: f.flag.gradedSubmissions.map(
              T.toGradedSubmissionDTO,
            ),
          })),
        ),
      );
    }

    if (await this.isReader(this.instance.params)) {
      const data = await this.db.readerProjectAllocation.findMany({
        where: { project: { supervisorId: this.id } },
        include: {
          student: {
            include: {
              userInInstance: { include: { user: true } },
              studentFlags: {
                include: { flag: { include: { gradedSubmissions: true } } },
              },
            },
          },
          project: {
            include: {
              flagsOnProject: { include: { flag: true } },
              tagsOnProject: { include: { tag: true } },
            },
          },
        },
      });

      assignedProjects.push(
        ...data.flatMap((a) =>
          a.student.studentFlags.flatMap((f) => ({
            project: T.toProjectDTO(a.project),
            student: T.toStudentDTO(a.student),
            markerType: MarkerType.READER,
            gradedSubmissions: f.flag.gradedSubmissions.map(
              T.toGradedSubmissionDTO,
            ),
          })),
        ),
      );
    }

    return assignedProjects.sort((a, b) =>
      a.student.id.localeCompare(b.student.id),
    );
  }

  public async getMarkerType(studentId: string): Promise<MarkerType> {
    if (await this.isSupervisor(this.instance.params)) {
      const supervisor = await this.toSupervisor(this.instance.params);
      const allocations = await supervisor.getSupervisionAllocations();

      const allocation = allocations.find((a) => a.student.id === studentId);
      if (allocation !== undefined) return MarkerType.SUPERVISOR;
    }

    if (await this.isReader(this.instance.params)) {
      const reader = await this.toReader(this.instance.params);
      const allocations = await reader.getAllocations();

      const allocation = allocations.find((a) => a.student.id === studentId);
      if (allocation !== undefined) return MarkerType.READER;
    }

    throw new Error("User is not a marker for this student");
  }
}
