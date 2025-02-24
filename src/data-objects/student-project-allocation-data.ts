import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { DataObject } from "./data-object";

import { guidToMatric } from "@/config/guid-to-matric";
import {
  DB,
  DB_ProjectDetails,
  DB_ProjectInInstance,
  DB_StudentDetails,
  DB_StudentProjectAllocation,
  DB_SupervisorDetails,
  DB_User,
  DB_UserInInstance,
} from "@/db/types";

export class StudentProjectAllocationData extends DataObject {
  private allocationData: hello[];

  constructor(db: DB, data: hello[]) {
    super(db);
    this.db = db;
    this.allocationData = data;
  }

  static async fromDB(db: DB, params: InstanceParams) {
    const data = await db.studentProjectAllocation.findMany({
      where: expand(params),
      include: {
        student: { include: { userInInstance: { include: { user: true } } } },
        project: {
          include: {
            details: true,
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
          },
        },
      },
    });

    return new StudentProjectAllocationData(db, data);
  }

  public toStudentView() {
    return this.allocationData
      .map((allocation) => ({
        student: {
          id: allocation.student.userInInstance.user.id,
          name: allocation.student.userInInstance.user.name,
          email: allocation.student.userInInstance.user.email,
          ranking: allocation.studentRanking,
        },
        project: {
          id: allocation.project.details.id,
          title: allocation.project.details.title,
        },
        supervisor: {
          id: allocation.project.supervisor.userInInstance.user.id,
          name: allocation.project.supervisor.userInInstance.user.name,
        },
      }))
      .sort((a, b) => a.student.id.localeCompare(b.student.id));
  }

  public toProjectView() {
    return this.allocationData
      .map((allocation) => ({
        project: {
          id: allocation.project.details.id,
          title: allocation.project.details.title,
          capacityLowerBound: allocation.project.details.capacityLowerBound,
          capacityUpperBound: allocation.project.details.capacityUpperBound,
        },
        supervisor: {
          id: allocation.project.supervisor.userInInstance.user.id,
          name: allocation.project.supervisor.userInInstance.user.name,
        },
        student: {
          id: allocation.student.userInInstance.user.id,
          name: allocation.student.userInInstance.user.name,
          ranking: allocation.studentRanking,
        },
      }))
      .sort((a, b) => a.project.id.localeCompare(b.project.id));
  }

  public toSupervisorView() {
    return this.allocationData
      .map((allocation) => ({
        project: {
          id: allocation.project.details.id,
          title: allocation.project.details.title,
        },
        supervisor: {
          id: allocation.project.supervisor.userInInstance.user.id,
          name: allocation.project.supervisor.userInInstance.user.name!,
          email: allocation.project.supervisor.userInInstance.user.email!,
          allocationLowerBound:
            allocation.project.supervisor.projectAllocationLowerBound,
          allocationTarget:
            allocation.project.supervisor.projectAllocationTarget,
          allocationUpperBound:
            allocation.project.supervisor.projectAllocationUpperBound,
        },
        student: {
          id: allocation.student.userInInstance.user.id,
          name: allocation.student.userInInstance.user.name,
          ranking: allocation.studentRanking,
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
      .map(({ project: p, student, ...e }) => ({
        project: {
          id: p.projectId,
          title: p.details.title,
          description: p.details.description,
          supervisor: p.supervisor.userInInstance.user,
          specialTechnicalRequirements:
            p.details.specialTechnicalRequirements ?? "",
        },
        student: {
          id: student.userInInstance.user.id,
          name: student.userInInstance.user.name,
          matric: guidToMatric(student.userInInstance.user.id),
          level: student.studentLevel,
          email: student.userInInstance.user.email,
          ranking: e.studentRanking,
        },
        supervisor: p.supervisor.userInInstance.user,
      }))
      .sort((a, b) => a.student.id.localeCompare(b.student.id));
  }
}

// pin
type hello = DB_StudentProjectAllocation & {
  student: {
    userInInstance: { user: DB_User } & DB_UserInInstance;
  } & DB_StudentDetails;
  project: {
    details: DB_ProjectDetails;
    supervisor: {
      userInInstance: { user: DB_User } & DB_UserInInstance;
    } & DB_SupervisorDetails;
  } & DB_ProjectInInstance;
};
