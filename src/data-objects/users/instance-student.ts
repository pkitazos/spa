import { expand } from "@/lib/utils/general/instance-params";
import { sortPreferenceType } from "@/lib/utils/preferences/sort";
import { ProjectPreferenceCardDto } from "@/lib/validations/board";
import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { updateManyPreferenceTransaction } from "@/db/transactions/update-many-preferences";
import { updatePreferenceTransaction } from "@/db/transactions/update-preference";
import {
  projectDataToDTO,
  studentDetailsToDto,
  studentToDTO,
} from "@/db/transformers";
import { DB, PreferenceType } from "@/db/types";
import { ProjectDTO } from "@/dto/project";
import {
  StudentDetailsDTO,
  StudentDraftPreferenceDTO,
  StudentDTO,
  StudentSubmittedPreferenceDTO,
} from "@/dto/student";

export class InstanceStudent extends User {
  instance: AllocationInstance;

  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id);
    this.instance = new AllocationInstance(db, params);
  }

  public async get(): Promise<StudentDTO> {
    return await this.db.studentDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: { userInInstance: { include: { user: true } } },
      })
      .then(studentToDTO);
  }

  public async getDetails(): Promise<StudentDetailsDTO> {
    return await this.db.studentDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
      })
      .then(studentDetailsToDto);
  }

  public async hasSelfDefinedProject(): Promise<boolean> {
    return !!(await this.db.projectInInstance.findFirst({
      where: {
        details: { preAllocatedStudentId: this.id },
        ...expand(this.instance.params),
      },
    }));
  }

  public async hasAllocation(): Promise<boolean> {
    return !!(await this.db.studentProjectAllocation.findFirst({
      where: { userId: this.id, ...expand(this.instance.params) },
    }));
  }

  public async getAllocation(): Promise<{
    project: ProjectDTO;
    studentRanking: number;
  }> {
    return await this.db.studentProjectAllocation
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: { project: { include: { details: true } } },
      })
      .then((x) => ({
        project: projectDataToDTO(x.project),
        studentRanking: x.studentRanking,
      }));
  }

  public async getLatestSubmissionDateTime(): Promise<Date | undefined> {
    const { latestSubmissionDateTime } = await this.getDetails();

    return latestSubmissionDateTime;
  }

  public async getDraftPreference(
    projectId: string,
  ): Promise<PreferenceType | undefined> {
    return await this.db.studentDraftPreference
      .findFirst({
        where: { userId: this.id, projectId, ...expand(this.instance.params) },
        select: { type: true },
      })
      .then((x) => x?.type);
  }

  public async getAllDraftPreferences(): Promise<StudentDraftPreferenceDTO[]> {
    return await this.db.studentDraftPreference
      .findMany({
        where: { userId: this.id, ...expand(this.instance.params) },
        select: {
          type: true,
          score: true,
          project: {
            include: {
              details: true,
              supervisor: {
                select: { userInInstance: { select: { user: true } } },
              },
            },
          },
        },
        orderBy: { score: "asc" },
      })
      .then((data) =>
        data
          .sort(sortPreferenceType)
          .map((x) => ({
            project: projectDataToDTO(x.project),
            supervisor: x.project.supervisor.userInInstance.user,
            score: x.score,
            type: x.type,
          })),
      );
  }

  public async getSubmittedPreferences(): Promise<
    StudentSubmittedPreferenceDTO[]
  > {
    return await this.db.studentDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: {
          studentSubmittedPreferences: {
            include: {
              project: {
                include: {
                  details: true,
                  supervisor: {
                    include: { userInInstance: { include: { user: true } } },
                  },
                },
              },
            },
            orderBy: { rank: "asc" },
          },
        },
      })
      .then((data) =>
        data.studentSubmittedPreferences.map((x) => ({
          project: projectDataToDTO(x.project),
          rank: x.rank,
          supervisor: x.project.supervisor.userInInstance.user,
        })),
      );
  }

  public async getPreferenceBoardState(): Promise<
    Record<PreferenceType, ProjectPreferenceCardDto[]>
  > {
    const res = await this.getAllDraftPreferences();

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
    return await this.db.studentDetails
      .update({
        where: {
          studentDetailsId: {
            userId: this.id,
            ...expand(this.instance.params),
          },
        },
        data: { studentLevel: level },
      })
      .then(studentDetailsToDto);
  }

  public async updateDraftPreferenceType(
    projectId: string,
    preferenceType: PreferenceType | undefined,
  ): Promise<void> {
    // TODO fix
    return await updatePreferenceTransaction(this.db, {
      userId: this.id,
      projectId,
      preferenceType,
      params: this.instance.params,
    });
  }

  public async updateDraftPreferenceRank(
    projectId: string,
    updatedRank: number,
    preferenceType: PreferenceType,
  ): Promise<{ project: ProjectDTO; rank: number }> {
    return await this.db.studentDraftPreference
      .update({
        where: {
          draftPreferenceId: {
            projectId,
            userId: this.id,
            ...expand(this.instance.params),
          },
        },
        data: { type: preferenceType, score: updatedRank },
        include: { project: { include: { details: true } } },
      })
      .then((data) => ({
        project: projectDataToDTO(data.project),
        rank: updatedRank,
      }));
  }

  public async updateManyDraftPreferenceTypes(
    projectIds: string[],
    preferenceType: PreferenceType | undefined,
  ): Promise<void> {
    // TODO fix
    return await updateManyPreferenceTransaction(this.db, {
      userId: this.id,
      params: this.instance.params,
      projectIds,
      preferenceType,
    });
  }

  public async submitPreferences(): Promise<Date> {
    const newSubmissionDateTime = new Date();

    await this.db.$transaction(async (tx) => {
      const preferences = await tx.studentDraftPreference.findMany({
        where: {
          userId: this.id,
          type: PreferenceType.PREFERENCE,
          ...expand(this.instance.params),
        },
        select: { projectId: true, score: true },
        orderBy: { score: "asc" },
      });

      await tx.studentSubmittedPreference.deleteMany({
        where: { userId: this.id, ...expand(this.instance.params) },
      });

      await tx.studentSubmittedPreference.createMany({
        data: preferences.map(({ projectId }, i) => ({
          projectId,
          rank: i + 1,
          userId: this.id,
          ...expand(this.instance.params),
        })),
      });

      await tx.studentDetails.update({
        where: {
          studentDetailsId: {
            userId: this.id,
            ...expand(this.instance.params),
          },
        },
        data: { latestSubmissionDateTime: newSubmissionDateTime },
      });
    });

    return newSubmissionDateTime;
  }
}
