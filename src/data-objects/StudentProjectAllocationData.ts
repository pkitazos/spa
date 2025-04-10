import { guidToMatric } from "@/config/guid-to-matric";
import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import { StudentDTO, SupervisorDTO, ProjectDTO } from "@/dto";

import { DataObject } from "./data-object";

export type allocationDataDTO = {
  student: StudentDTO;
  supervisor: SupervisorDTO;
  project: ProjectDTO;
  ranking: number;
};

export class StudentProjectAllocationData extends DataObject {
  private allocationData: allocationDataDTO[];

  constructor(db: DB, data: allocationDataDTO[]) {
    super(db);
    this.db = db;
    this.allocationData = data;
  }

  static async fromDB(db: DB, params: InstanceParams) {
    const data = await db.studentProjectAllocation.findMany({
      where: expand(params),
      include: {
        student: {
          include: {
            userInInstance: { include: { user: true } },
            studentFlags: { include: { flag: true } },
          },
        },
        project: {
          include: {
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
          },
        },
      },
    });

    const formatData = data.map((x) => ({
      student: T.toStudentDTO(x.student),
      supervisor: T.toSupervisorDTO(x.project.supervisor),
      project: T.toProjectDTO(x.project),
      ranking: x.studentRanking,
    }));

    return new StudentProjectAllocationData(db, formatData);
  }

  public toRecord() {
    return this.allocationData.reduce(
      (acc, { project, student }) => ({
        ...acc,
        [project.id]: [...(acc[project.id] ?? []), student.id],
      }),
      {} as Record<string, string[]>,
    );
  }

  public toStudentView() {
    return this.allocationData
      .map(({ ranking, student, project, supervisor }) => ({
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          ranking,
        },
        project: { id: project.id, title: project.title },
        supervisor: { id: supervisor.id, name: supervisor.name },
      }))
      .sort((a, b) => a.student.id.localeCompare(b.student.id));
  }

  public toProjectView() {
    return this.allocationData
      .map((allocation) => ({
        project: {
          id: allocation.project.id,
          title: allocation.project.title,
          capacityLowerBound: allocation.project.capacityLowerBound,
          capacityUpperBound: allocation.project.capacityUpperBound,
        },
        supervisor: {
          id: allocation.supervisor.id,
          name: allocation.supervisor.name,
        },
        student: {
          id: allocation.student.id,
          name: allocation.student.name,
          ranking: allocation.ranking,
        },
      }))
      .sort((a, b) => a.project.id.localeCompare(b.project.id));
  }

  public toSupervisorView() {
    return this.allocationData
      .map((allocation) => ({
        project: { id: allocation.project.id, title: allocation.project.title },
        supervisor: {
          id: allocation.supervisor.id,
          name: allocation.supervisor.name!,
          email: allocation.supervisor.email!,
          allocationLowerBound: allocation.supervisor.allocationLowerBound,
          allocationTarget: allocation.supervisor.allocationTarget,
          allocationUpperBound: allocation.supervisor.allocationUpperBound,
        },
        student: {
          id: allocation.student.id,
          name: allocation.student.name,
          ranking: allocation.ranking,
        },
      }))
      .sort((a, b) => a.supervisor.id.localeCompare(b.supervisor.id));
  }

  public getViews() {
    return {
      byStudent: this.toStudentView(),
      byProject: this.toProjectView(),
      bySupervisor: this.toSupervisorView(),
    };
  }

  public toExportData() {
    return this.allocationData
      .map(({ project: p, student, supervisor, ...e }) => ({
        project: {
          id: p.id,
          title: p.title,
          description: p.description,
          supervisor: supervisor,
          specialTechnicalRequirements: p.specialTechnicalRequirements ?? "",
        },
        student: {
          id: student.id,
          name: student.name,
          matric: guidToMatric(student.id),
          level: student.level,
          email: student.email,
          ranking: e.ranking,
        },
        supervisor: supervisor,
      }))
      .sort((a, b) => a.student.id.localeCompare(b.student.id));
  }
}
