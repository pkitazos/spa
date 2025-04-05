import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import {
  UnitOfAssessmentGradeDTO,
  ProjectDTO,
  StudentDTO,
  UnitOfAssessmentDTO,
  PartialMarkDTO,
} from "@/dto";
import { InstanceParams } from "@/lib/validations/params";
import { MarkerType } from "@prisma/client";

import { AllocationInstance } from "../space/instance";
import { User } from ".";
import { expand } from "@/lib/utils/general/instance-params";

export class Marker extends User {
  instance: AllocationInstance;

  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id);
    this.instance = new AllocationInstance(db, params);
  }

  async getMarksForStudentSubmission(
    unitOfAssessmentId: string,
    studentId: string,
  ): Promise<UnitOfAssessmentGradeDTO> {
    const result = await this.db.markingSubmission.findFirst({
      where: { markerId: this.id, studentId, unitOfAssessmentId },
      include: { criterionScores: true },
    });

    const marksRaw = result?.criterionScores || [];

    return {
      unitOfAssessmentId,
      studentId,
      draft: false,
      marks: marksRaw.reduce(
        (acc, val) => ({
          ...acc,
          [val.assessmentCriterionId]: {
            mark: val.grade,
            justification: val.justification,
          },
        }),
        {} as Record<string, { mark: number; justification: string }>,
      ),
      finalComment: result?.summary ?? "",
      recommendation: result?.recommendedForPrize ?? false,
    };
  }

  public async getProjectsWithSubmissions(): Promise<
    {
      project: ProjectDTO;
      student: StudentDTO;
      markerType: MarkerType;
      unitsOfAssessment: {
        unit: UnitOfAssessmentDTO;
        isSaved: boolean;
        isSubmitted: boolean;
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
            unitsOfAssessment: f.flag.unitsOfAssessment.map((x) => {
              const submission = x.markerSubmissions.find(
                (s) => s.studentId === a.student.userId,
              );

              return {
                unit: T.toUnitOfAssessmentDTO(x),
                isSaved: !!submission,
                isSubmitted: !(submission?.draft ?? true),
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
            unitsOfAssessment: f.flag.unitsOfAssessment.map((x) => {
              const submission = x.markerSubmissions.find(
                (s) => s.studentId === a.student.userId,
              );

              return {
                unit: T.toUnitOfAssessmentDTO(x),
                isSaved: !!submission,
                isSubmitted: !(submission?.draft ?? true),
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

  async writeMarks({
    unitOfAssessmentId,
    studentId,
    marks = {},
    finalComment = "",
    recommendation,
    draft,
  }: PartialMarkDTO) {
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
        },
        update: {
          draft,
          summary: finalComment,
          recommendedForPrize: recommendation,
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
}
