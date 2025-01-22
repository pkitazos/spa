import { ProjectPreferenceCardDto } from "@/lib/validations/board";
import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { DAL } from "@/data-access";
import { PreferenceType } from "@/db/types";
import { ProjectDTO } from "@/dto/project";
import {
  StudentDetailsDTO,
  StudentDraftPreferenceDTO,
  StudentDTO,
  StudentSubmittedPreferenceDTO,
} from "@/dto/student";

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

  public async getDraftPreference(
    projectId: string,
  ): Promise<PreferenceType | undefined> {
    return await this.dal.student.getDraftPreference(
      this.id,
      projectId,
      this.instance.params,
    );
  }

  public async getAllDraftPreferences(): Promise<StudentDraftPreferenceDTO[]> {
    return await this.dal.student.getDraftPreferences(
      this.id,
      this.instance.params,
    );
  }

  public async getSubmittedPreferences(): Promise<
    StudentSubmittedPreferenceDTO[]
  > {
    return await this.dal.student.getSubmittedPreferences(
      this.id,
      this.instance.params,
    );
  }

  public async getPreferenceBoardState(): Promise<
    Record<PreferenceType, ProjectPreferenceCardDto[]>
  > {
    const res = await this.dal.student.getDraftPreferences(
      this.id,
      this.instance.params,
    );

    const allProjects = res.map((e) => ({
      id: e.project.id,
      title: e.project.title,
      columnId: e.type,
      rank: e.score,
      supervisor: e.supervisor,
    }));

    const boardState: Record<PreferenceType, ProjectPreferenceCardDto[]> = {
      [PreferenceType.PREFERENCE]: allProjects.filter(
        (e) => e.columnId === PreferenceType.PREFERENCE,
      ),

      [PreferenceType.SHORTLIST]: allProjects.filter(
        (e) => e.columnId === PreferenceType.SHORTLIST,
      ),
    };

    return boardState;
  }

  public async setStudentLevel(level: number): Promise<StudentDetailsDTO> {
    return await this.dal.student.setStudentLevel(
      this.id,
      level,
      this.instance.params,
    );
  }

  public async updateDraftPreferenceType(
    projectId: string,
    preferenceType: PreferenceType | undefined,
  ): Promise<void> {
    return await this.dal.student.setDraftPreferenceType(
      this.id,
      projectId,
      preferenceType,
      this.instance.params,
    );
  }

  public async updateDraftPreferenceRank(
    projectId: string,
    updatedRank: number,
    preferenceType: PreferenceType,
  ): Promise<{ project: ProjectDTO; rank: number }> {
    return await this.dal.student.setDraftPreference(
      this.id,
      projectId,
      preferenceType,
      updatedRank,
      this.instance.params,
    );
  }

  public async updateManyDraftPreferenceTypes(
    projectIds: string[],
    preferenceType: PreferenceType | undefined,
  ): Promise<void> {
    return await this.dal.student.setManyDraftPreferenceTypes(
      this.id,
      projectIds,
      preferenceType,
      this.instance.params,
    );
  }

  public async submitPreferences(): Promise<Date> {
    return await this.dal.student.submitPreferences(
      this.id,
      this.instance.params,
    );
  }
}
