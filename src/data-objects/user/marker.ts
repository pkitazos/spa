import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import {
  UnitOfAssessmentGradeDTO,
  ProjectDTO,
  StudentDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import { MarkerType } from "@prisma/client";

import { AllocationInstance } from "../space/instance";
import { User } from ".";

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
      where: {
        ...expand(this.instance.params),
        unitOfAssessmentId,
        studentId,
        markerId: this.id,
      },
    });

    const marksRaw = await this.db.criterionScore.findMany({
      where: {
        ...expand(this.instance.params),
        studentId,
        markerId: this.id,
        criterion: { unitOfAssessmentId },
      },
    });

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
    let assignedProjects: Ret[] = [];

    if (await this.isSupervisor(this.instance.params)) {
      const data = await this.db.studentProjectAllocation.findMany({
        where: { project: { supervisorId: this.id } },
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
                        include: { assessmentCriteria: true, flag: true },
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
            unitsOfAssessment: f.flag.unitsOfAssessment.map((x) => ({
              unit: T.toUnitOfAssessmentDTO(x),
              isSaved: true,
              isSubmitted: false,
            })),
          })),
        ),
      );
    }

    if (await this.isReader(this.instance.params)) {
      const readerAllocations = await this.db.readerProjectAllocation.findMany({
        where: { readerId: this.id },
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
                        include: { assessmentCriteria: true, flag: true },
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

      const hello = readerAllocations.flatMap((a) =>
        a.student.studentFlags.map(
          (f) =>
            ({
              project: T.toProjectDTO(a.project),
              student: T.toStudentDTO(a.student),
              markerType: MarkerType.READER,
              unitsOfAssessment: f.flag.unitsOfAssessment.map((x) =>
                T.toUnitOfAssessmentDTO(x),
              ),
            }) satisfies Ret,
        ),
      );
      assignedProjects = [...assignedProjects, ...hello];
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
