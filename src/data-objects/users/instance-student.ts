import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { DAL } from "@/data-access";
import { ProjectDTO } from "@/dto/project";
import { StudentDetailsDTO, StudentDTO } from "@/dto/student";

export class InstanceStudent extends User {
  instance: AllocationInstance;

  constructor(dal: DAL, id: string, params: InstanceParams) {
    super(dal, id);
    this.instance = new AllocationInstance(dal, params);
  }

  public async get(): Promise<StudentDTO> {
    return await this.dal.student.get(this.id, this.instance.params);
  }

  public async getDetails(): Promise<StudentDetailsDTO> {
    return await this.dal.student.getStudentDetails(
      this.id,
      this.instance.params,
    );
  }

  public async hasSelfDefinedProject(): Promise<boolean> {
    return await this.dal.student.hasSelfDefinedProject(
      this.id,
      this.instance.params,
    );
  }

  public async hasAllocation(): Promise<boolean> {
    return await this.dal.student.hasAllocatedProject(
      this.id,
      this.instance.params,
    );
  }

  public async getAllocation(): Promise<{
    project: ProjectDTO;
    studentRanking: number;
  }> {
    return await this.dal.student.getAllocatedProject(
      this.id,
      this.instance.params,
    );
  }

  public async getLatestSubmissionDateTime(): Promise<Date | undefined> {
    return await this.dal.student
      .getStudentDetails(this.id, this.instance.params)
      .then((x) => x.latestSubmissionDateTime);
  }

  public async setStudentLevel(level: number): Promise<StudentDetailsDTO> {
    return await this.dal.student.setStudentLevel(
      this.id,
      level,
      this.instance.params,
    );
  }
}
