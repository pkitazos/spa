import { InstanceParams } from "@/lib/validations/params";

import { getAllAllocationData } from "@/data-access/allocation-data";

export type AllocationDBData = Awaited<ReturnType<typeof getAllAllocationData>>;

export class StudentProjectAllocationData {
  private allocationData: AllocationDBData;
  constructor(data: AllocationDBData) {
    this.allocationData = data;
  }

  static async fromDB(params: InstanceParams) {
    const data = await getAllAllocationData(params);
    return new StudentProjectAllocationData(data);
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
}
