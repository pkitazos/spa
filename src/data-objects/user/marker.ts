import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import {
  MarkingSubmissionDTO,
  ProjectDTO,
  StudentDTO,
  UnitOfAssessmentDTO,
  PartialMarkingSubmissionDTO,
} from "@/dto";
import { InstanceParams } from "@/lib/validations/params";
import { MarkerType } from "@prisma/client";

import { AllocationInstance } from "../space/instance";
import { User } from ".";
import { expand } from "@/lib/utils/general/instance-params";
import { MarkingSubmissionStatus } from "@/dto/result/marking-submission-status";

export class Marker extends User {
  public static computeStatus(
    u: UnitOfAssessmentDTO,
    submission: MarkingSubmissionDTO | undefined,
  ): MarkingSubmissionStatus {
    if (!u.isOpen) {
      return MarkingSubmissionStatus.CLOSED;
    } else if (!submission) {
      return MarkingSubmissionStatus.OPEN;
    } else if (submission.draft) {
      return MarkingSubmissionStatus.DRAFT;
    } else {
      return MarkingSubmissionStatus.SUBMITTED;
    }
  }

  instance: AllocationInstance;

  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id);
    this.instance = new AllocationInstance(db, params);
  }

  async getMarkingSubmission(
    unitOfAssessmentId: string,
    studentId: string,
  ): Promise<MarkingSubmissionDTO> {
    const result = await this.db.markingSubmission.findFirst({
      where: { markerId: this.id, studentId, unitOfAssessmentId },
      include: { criterionScores: true },
    });

    console.log(result);

    if (result) return T.toMarkingSubmissionDTO(result);

    return {
      unitOfAssessmentId,
      studentId,
      grade: -1,
      markerId: this.id,
      draft: true,
      marks: {},
      finalComment: "",
      recommendation: false,
    };
  }

  public async getProjectsWithSubmissions(): Promise<
    {
      project: ProjectDTO;
      student: StudentDTO;
      markerType: MarkerType;
      unitsOfAssessment: {
        unit: UnitOfAssessmentDTO;
        status: MarkingSubmissionStatus;
      }[];
    }[]
  > {
    type Ret = Awaited<ReturnType<typeof this.getProjectsWithSubmissions>>;
    let assignedProjects: Ret = [];

    const markerId = this.id;

    if (await this.isSupervisor(this.instance.params)) {
      const data = await this.db.studentProjectAllocation.findMany({
        where: {
          ...expand(this.instance.params),
          project: { supervisorId: this.id },
        },
        include: {
          student: {
            include: {
              userInInstance: { include: { user: true } },
              studentFlags: {
                include: {
                  flag: {
                    include: {
                      unitsOfAssessment: {
                        where: { allowedMarkerTypes: { has: "SUPERVISOR" } },
                        include: {
                          assessmentCriteria: true,
                          flag: true,
                          markerSubmissions: { where: { markerId } },
                        },
                      },
                    },
                  },
                },
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

      assignedProjects = assignedProjects.concat(
        data.flatMap((a) =>
          a.student.studentFlags.flatMap((f) => ({
            project: T.toProjectDTO(a.project),
            student: T.toStudentDTO(a.student),
            markerType: MarkerType.SUPERVISOR,
            unitsOfAssessment: f.flag.unitsOfAssessment.map((u) => {
              const submission = u.markerSubmissions.find(
                (s) => s.studentId === a.student.userId,
              );

              const unit = T.toUnitOfAssessmentDTO(u);

              return {
                unit,
                status: Marker.computeStatus(
                  unit,
                  submission && T.toMarkingSubmissionDTO(submission),
                ),
              };
            }),
          })),
        ),
      );
    }

    if (await this.isReader(this.instance.params)) {
      const readerAllocations = await this.db.readerProjectAllocation.findMany({
        where: { ...expand(this.instance.params), readerId: this.id },
        include: {
          student: {
            include: {
              userInInstance: { include: { user: true } },
              studentFlags: {
                include: {
                  flag: {
                    include: {
                      unitsOfAssessment: {
                        where: { allowedMarkerTypes: { has: "READER" } },
                        include: {
                          assessmentCriteria: true,
                          flag: true,
                          markerSubmissions: { where: { markerId: this.id } },
                        },
                      },
                    },
                  },
                },
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

      assignedProjects = assignedProjects.concat(
        readerAllocations.flatMap((a) =>
          a.student.studentFlags.map((f) => ({
            project: T.toProjectDTO(a.project),
            student: T.toStudentDTO(a.student),
            markerType: MarkerType.READER,
            unitsOfAssessment: f.flag.unitsOfAssessment.map((u) => {
              const submission = u.markerSubmissions.find(
                (s) => s.studentId === a.student.userId,
              );

              const unit = T.toUnitOfAssessmentDTO(u);

              return {
                unit,
                status: Marker.computeStatus(
                  unit,
                  submission && T.toMarkingSubmissionDTO(submission),
                ),
              };
            }),
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

  public async writeMarks({
    unitOfAssessmentId,
    studentId,
    marks = {},
    finalComment = "",
    recommendation,
    draft,
    grade,
  }: Omit<PartialMarkingSubmissionDTO, "markerId">) {
    const markerId = this.id;
    await this.db.$transaction([
      this.db.markingSubmission.upsert({
        where: {
          studentMarkerSubmission: { markerId, studentId, unitOfAssessmentId },
        },
        create: {
          markerId,
          studentId,
          unitOfAssessmentId,
          draft,
          summary: finalComment,
          recommendedForPrize: recommendation,
          grade,
        },
        update: {
          draft,
          summary: finalComment,
          recommendedForPrize: recommendation,
          grade: grade,
        },
      }),

      ...Object.entries(marks).map(([assessmentCriterionId, m]) =>
        this.db.criterionScore.upsert({
          where: {
            markingCriterionSubmission: {
              markerId,
              studentId,
              assessmentCriterionId,
            },
          },
          create: {
            markerId,
            studentId,
            assessmentCriterionId,
            unitOfAssessmentId,
            grade: m.mark || -1,
            justification: m.justification || "",
          },
          update: { grade: m.mark, justification: m.justification },
        }),
      ),
    ]);
  }

  public async writeFinalMark({
    studentId,
    unitOfAssessmentId,
    grade,
    comment,
  }: {
    studentId: string;
    unitOfAssessmentId: string;
    grade: number;
    comment: string;
  }) {
    await this.db.finalUnitOfAssessmentGrade.upsert({
      where: { studentAssessmentGrade: { studentId, unitOfAssessmentId } },
      create: { studentId, unitOfAssessmentId, comment, grade },
      update: { studentId, unitOfAssessmentId, comment, grade },
    });
  }
}
