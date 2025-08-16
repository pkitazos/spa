import { PAGES } from "@/config/pages";
import { ADMIN_TABS_BY_STAGE } from "@/config/side-panel-tabs/admin-tabs-by-stage";
import { computeProjectSubmissionTarget } from "@/config/submission-target";

import {
  type UnitOfAssessmentDTO,
  type AssessmentCriterionDTO,
  type FlagDTO,
  type InstanceDTO,
  type InstanceDisplayData,
  type AlgorithmDTO,
  type TagDTO,
  type ProjectDTO,
  type SupervisorDTO,
  type UserDTO,
  type StudentDTO,
  type ReaderDTO,
} from "@/dto";

import { collectMatchingData } from "@/db/transactions/collect-matching-data";
import { Transformers as T } from "@/db/transformers";
import {
  type DB,
  Stage,
  type New,
  AllocationMethod,
  type PreferenceType,
} from "@/db/types";

import { HttpMatchingService } from "@/lib/services/matching";
import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { setDiff } from "@/lib/utils/general/set-difference";
import { nubsById } from "@/lib/utils/list-unique";
import { type InstanceParams } from "@/lib/validations/params";
import { type TabType } from "@/lib/validations/tabs";

import { DataObject } from "../data-object";
import { MatchingAlgorithm } from "../matching-algorithm";
import {
  StudentProjectAllocationData,
  type StudentProjectAllocationDTO,
} from "../student-project-allocation-data";
import { User, type Student, type Supervisor } from "../user";

import { Project } from "..";

import { AllocationGroup } from "./group";
import { AllocationSubGroup } from "./sub-group";

export const byTitle = <T extends { title: string }>({ title }: T) => title;
export const byDisplayName = <T extends { displayName: string }>({
  displayName,
}: T) => displayName;

export class AllocationInstance extends DataObject {
  async getUnitOfAssessment(
    unitOfAssessmentId: string,
  ): Promise<UnitOfAssessmentDTO> {
    return await this.db.unitOfAssessment
      .findFirstOrThrow({
        where: { id: unitOfAssessmentId },
        include: { flag: true, assessmentCriteria: true },
      })
      .then((x) => T.toUnitOfAssessmentDTO(x));
  }

  public async getCriteria(
    unitOfAssessmentId: string,
  ): Promise<AssessmentCriterionDTO[]> {
    const data = await this.db.assessmentCriterion.findMany({
      where: { unitOfAssessmentId },
      orderBy: { layoutIndex: "asc" },
    });

    return data.map((x) => T.toAssessmentCriterionDTO(x));
  }

  public async getFlagsWithAssessmentDetails(): Promise<
    (FlagDTO & { unitsOfAssessment: UnitOfAssessmentDTO[] })[]
  > {
    const flagData = await this.db.flag.findMany({
      where: expand(this.params),
      include: {
        unitsOfAssessment: {
          include: { flag: true, assessmentCriteria: true },
        },
      },
    });

    return flagData.map((f) => ({
      ...T.toFlagDTO(f),
      unitsOfAssessment: f.unitsOfAssessment.map((x) =>
        T.toUnitOfAssessmentDTO(x),
      ),
    }));
  }

  public params: InstanceParams;
  private _group: AllocationGroup | undefined;
  private _subgroup: AllocationSubGroup | undefined;
  private _data: InstanceDTO | undefined;

  constructor(db: DB, params: InstanceParams) {
    super(db);
    this.params = params;
  }

  // TODO this is weird - should it live here?
  static async toQualifiedPaths(
    db: DB,
    instances: InstanceDTO[],
  ): Promise<InstanceDisplayData[]> {
    const instanceData = await db.allocationInstance.findMany({
      where: { OR: instances.map((x) => toInstanceId(x)) },
      include: { allocationSubGroup: { include: { allocationGroup: true } } },
    });

    return instanceData.map(
      ({
        allocationSubGroup: { allocationGroup: group, ...subGroup },
        ...instance
      }) => ({
        group: { id: group.id, displayName: group.displayName },
        subGroup: { id: subGroup.id, displayName: subGroup.displayName },
        instance: { id: instance.id, displayName: instance.displayName },
      }),
    );
  }

  public async exists(): Promise<boolean> {
    return !!(await this.db.allocationInstance.findFirst({
      where: toInstanceId(this.params),
    }));
  }

  public async get(refetch = false): Promise<InstanceDTO> {
    if (refetch || !this._data) {
      this._data = await this.db.allocationInstance
        .findFirstOrThrow({ where: toInstanceId(this.params) })
        .then((x) => T.toAllocationInstanceDTO(x));
    }

    return this._data!;
  }

  public async getAllocationData(): Promise<StudentProjectAllocationData> {
    return await StudentProjectAllocationData.fromDB(this.db, this.params);
  }

  // ---------------------------------------------------------------------------
  public async createAlgorithm(
    data: Omit<AlgorithmDTO, "id">,
  ): Promise<AlgorithmDTO> {
    return await this.db.algorithm
      .create({
        data: {
          ...expand(this.params),
          displayName: data.displayName,
          description: data.description ?? null,
          flag1: data.flag1,
          flag2: data.flag2 ?? null,
          flag3: data.flag3 ?? null,
          maxRank: data.maxRank,
          targetModifier: data.targetModifier,
          upperBoundModifier: data.upperBoundModifier,
        },
      })
      .then((x) => T.toAlgorithmDTO(x));
  }

  public async getMatchingData(algorithm: MatchingAlgorithm) {
    const instanceData = await this.get();
    return await collectMatchingData(this.db, instanceData, algorithm);
  }

  public async getAllAlgorithms(): Promise<AlgorithmDTO[]> {
    const algs = await this.db.algorithm.findMany({
      where: expand(this.params),
      orderBy: { createdAt: "asc" },
    });

    return algs.map((x) => T.toAlgorithmDTO(x));
  }

  public getAlgorithm(algConfigId: string): MatchingAlgorithm {
    const matchingService = new HttpMatchingService();
    return new MatchingAlgorithm(
      this.db,
      { algConfigId, ...this.params },
      matchingService,
    );
  }

  // TODO review the nullish behaviour here
  public async getSelectedAlg(): Promise<MatchingAlgorithm | undefined> {
    const { selectedAlgConfigId: algConfigId } = await this.get();

    if (!algConfigId) return undefined;
    const matchingService = new HttpMatchingService();
    return new MatchingAlgorithm(
      this.db,
      { algConfigId, ...this.params },
      matchingService,
    );
  }

  // ---------------------------------------------------------------------------
  public async getFlags(): Promise<FlagDTO[]> {
    return await this.db.flag.findMany({ where: expand(this.params) });
  }

  public async getTags(): Promise<TagDTO[]> {
    return await this.db.tag.findMany({ where: expand(this.params) });
  }

  public async getProjectDetails(): Promise<
    {
      project: ProjectDTO;
      supervisor: SupervisorDTO;
      allocatedStudent?: StudentDTO;
    }[]
  > {
    const projectData = await this.db.project.findMany({
      where: expand(this.params),
      include: {
        studentAllocations: {
          include: {
            student: {
              include: {
                userInInstance: { include: { user: true } },
                studentFlag: true,
              },
            },
          },
        },
        supervisor: {
          include: { userInInstance: { include: { user: true } } },
        },
        flagsOnProject: { include: { flag: true } },
        tagsOnProject: { include: { tag: true } },
      },
    });

    return projectData.map((p) => ({
      project: T.toProjectDTO(p),
      supervisor: T.toSupervisorDTO(p.supervisor),
      allocatedTo: p.studentAllocations.map((a) => a.userId),
      allocatedStudent: !!p.studentAllocations.at(0)
        ? T.toStudentDTO(p.studentAllocations[0].student)
        : undefined,
    }));
  }

  public async getProjectAllocations(): Promise<
    {
      project: ProjectDTO;
      supervisor: SupervisorDTO;
      student: StudentDTO;
      method: AllocationMethod;
    }[]
  > {
    const data = await this.db.studentProjectAllocation.findMany({
      where: expand(this.params),
      include: {
        project: {
          include: {
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
          },
        },
        student: {
          include: {
            userInInstance: { include: { user: true } },
            studentFlag: true,
          },
        },
      },
    });

    return data.map((a) => ({
      project: T.toProjectDTO(a.project),
      supervisor: T.toSupervisorDTO(a.project.supervisor),
      student: T.toStudentDTO(a.student),
      method: a.allocationMethod,
    }));
  }

  /**
   * Creates a userInInstance object linking the specified user to this instance;
   * Should not be run on its own - follow with appropriate calls to linkSupervisor, linkStudent, or linkReader
   * @param user userId to link
   */
  public async linkUser(user: UserDTO) {
    await this.db.userInInstance.upsert({
      where: {
        instanceMembership: { ...expand(this.params), userId: user.id },
      },
      create: { ...expand(this.params), userId: user.id },
      update: {},
    });
  }

  public async linkUsers(newSupervisors: UserDTO[]) {
    await this.db.userInInstance.createMany({
      data: newSupervisors.map((s) => ({
        ...expand(this.params),
        userId: s.id,
      })),
      skipDuplicates: true,
    });
  }

  async linkSupervisor(user: SupervisorDTO) {
    await this.db.supervisorDetails.create({
      data: {
        ...expand(this.params),
        projectAllocationLowerBound: 0,
        projectAllocationTarget: user.allocationTarget,
        projectAllocationUpperBound: user.allocationUpperBound,
        userId: user.id,
      },
    });
  }

  public async linkSupervisors(newSupervisors: SupervisorDTO[]) {
    await this.db.supervisorDetails.createMany({
      data: newSupervisors.map((user) => ({
        ...expand(this.params),

        projectAllocationLowerBound: 0,
        projectAllocationTarget: user.allocationTarget,
        projectAllocationUpperBound: user.allocationUpperBound,
        userId: user.id,
      })),
      skipDuplicates: true,
    });
  }

  public async linkStudents(newStudents: StudentDTO[]) {
    await this.db.studentDetails.createMany({
      data: newStudents.map((s) => ({
        ...expand(this.params),
        userId: s.id,
        flagId: s.flag.id,
      })),
      skipDuplicates: true,
    });
  }

  public async getSupervisors(): Promise<SupervisorDTO[]> {
    const supervisorData = await this.db.supervisorDetails.findMany({
      where: expand(this.params),
      include: { userInInstance: { include: { user: true } } },
    });

    return supervisorData.map((x) => T.toSupervisorDTO(x));
  }

  public async getSupervisorProjectDetails(): Promise<
    { supervisor: SupervisorDTO; projects: ProjectDTO[] }[]
  > {
    const supervisorData = await this.db.supervisorDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
        projects: {
          include: {
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
            studentAllocations: true,
          },
        },
      },
    });

    return supervisorData.map((s) => ({
      supervisor: T.toSupervisorDTO(s),
      projects: s.projects.map((p) => T.toProjectDTO(p)),
    }));
  }

  public async getSupervisorAllocationDetails(): Promise<
    {
      supervisor: SupervisorDTO;
      allocations: { project: ProjectDTO; student: StudentDTO }[];
    }[]
  > {
    const supervisorData = await this.db.supervisorDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
        projects: {
          where: { studentAllocations: { some: {} } },
          include: {
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
            studentAllocations: {
              include: {
                student: {
                  include: {
                    studentFlag: true,
                    userInInstance: { include: { user: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return supervisorData.map((s) => ({
      supervisor: T.toSupervisorDTO(s),
      allocations: s.projects.flatMap((p) =>
        p.studentAllocations.map((a) => ({
          project: T.toProjectDTO(p),
          student: T.toStudentDTO(a.student),
        })),
      ),
    }));
  }

  public async getSupervisorPreAllocations(): Promise<Record<string, number>> {
    const supervisorPreAllocations = await this.db.project
      .findMany({
        where: { ...expand(this.params), preAllocatedStudentId: { not: null } },
      })
      .then((data) =>
        data.reduce(
          (acc, val) => {
            acc[val.supervisorId] = (acc[val.supervisorId] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      );

    return supervisorPreAllocations;
  }

  public async getReaders(): Promise<ReaderDTO[]> {
    const readers = await this.db.readerDetails.findMany({
      where: expand(this.params),
      include: { userInInstance: { include: { user: true } } },
    });

    return readers.map((x) => T.toReaderDTO(x));
  }

  // TODO: standardise return type
  public async getStudentPreferenceDetails(): Promise<
    {
      student: StudentDTO;
      draftPreferences: {
        projectId: string;
        score: number;
        type: PreferenceType;
      }[];
      submittedPreferences: { projectId: string; rank: number }[];
    }[]
  > {
    const studentData = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
        draftPreferences: true,
        submittedPreferences: true,
        studentFlag: true,
      },
    });

    return studentData.map((u) => ({
      student: T.toStudentDTO(u),
      draftPreferences: u.draftPreferences,
      submittedPreferences: u.submittedPreferences,
    }));
  }

  public async getStudentAllocationDetails(): Promise<
    { student: StudentDTO; allocation: ProjectDTO | undefined }[]
  > {
    const students = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        studentFlag: true,
        userInInstance: { include: { user: true } },
        projectAllocation: {
          include: {
            project: {
              include: {
                flagsOnProject: { include: { flag: true } },
                tagsOnProject: { include: { tag: true } },
              },
            },
          },
        },
      },
    });

    return students.map((u) => ({
      student: T.toStudentDTO(u),
      allocation: u.projectAllocation?.project
        ? T.toProjectDTO(u.projectAllocation.project)
        : undefined,
    }));
  }

  public async getStudentAllocation(
    studentId: string,
  ): Promise<StudentProjectAllocationDTO | undefined> {
    const allocation = await this.db.studentProjectAllocation.findFirst({
      where: { userId: studentId, ...expand(this.params) },
      include: {
        project: {
          include: {
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
          },
        },
        student: {
          include: {
            userInInstance: { include: { user: true } },
            studentFlag: true,
          },
        },
      },
    });

    if (!allocation) return undefined;

    return {
      student: T.toStudentDTO(allocation.student),
      project: T.toProjectDTO(allocation.project),
      supervisor: T.toSupervisorDTO(allocation.project.supervisor),
      ranking: allocation.studentRanking,
      allocationMethod: allocation.allocationMethod,
    };
  }

  public async getProjectAllocation(
    projectId: string,
  ): Promise<StudentDTO | undefined> {
    const allocation = await this.db.studentProjectAllocation.findFirst({
      where: { projectId, ...expand(this.params) },
      include: {
        student: {
          include: {
            studentFlag: true,
            userInInstance: { include: { user: true } },
          },
        },
      },
    });

    if (!allocation) return undefined;

    return T.toStudentDTO(allocation.student);
  }

  public async createManualAllocation(
    studentId: string,
    projectId: string,
  ): Promise<void> {
    await this.db.studentProjectAllocation.create({
      data: {
        ...expand(this.params),
        userId: studentId,
        projectId,
        studentRanking: 1,
        allocationMethod: AllocationMethod.MANUAL,
      },
    });
  }

  public async getSummaryResults() {
    const algorithmData = await this.db.algorithm.findMany({
      where: expand(this.params),
      include: { matchingResult: { include: { matching: true } } },
      orderBy: { createdAt: "asc" },
    });

    return algorithmData
      .filter((x) => x.matchingResult !== null)
      .map(({ matchingResult, ...algorithm }) => ({
        algorithm: T.toAlgorithmDTO(algorithm),
        matchingResults: matchingResult!,
      }));
  }

  public async getStudentSuitableProjects(
    userId: string,
  ): Promise<ProjectDTO[]> {
    const { studentFlag } = await this.db.studentDetails.findFirstOrThrow({
      where: { ...expand(this.params), userId },
      include: { studentFlag: true },
    });

    const suitableProjects = await this.db.project.findMany({
      where: {
        ...expand(this.params),
        flagsOnProject: { some: { flagId: studentFlag.id } },
      },
      include: {
        flagsOnProject: { include: { flag: true } },
        tagsOnProject: { include: { tag: true } },
        studentAllocations: true,
      },
    });

    return suitableProjects
      .filter((p) => p.studentAllocations.length === 0)
      .map(T.toProjectDTO);
  }

  public async getSubmittedPreferences() {
    const data = await this.db.studentSubmittedPreference.findMany({
      where: expand(this.params),
      include: {
        project: { include: { tagsOnProject: { include: { tag: true } } } },
      },
      orderBy: [{ projectId: "asc" }, { rank: "asc" }, { userId: "asc" }],
    });

    return data.map((p) => ({
      studentId: p.userId,
      rank: p.rank,
      project: { id: p.projectId, title: p.project.title },
      supervisorId: p.project.supervisorId,
      tags: p.project.tagsOnProject.map((t) => t.tag),
    }));
  }

  public async getUnallocatedStudents(): Promise<StudentDTO[]> {
    const studentData = await this.db.studentDetails.findMany({
      where: { ...expand(this.params), projectAllocation: { is: null } },
      include: {
        studentFlag: true,
        userInInstance: { include: { user: true } },
      },
    });

    return studentData.map((s) => T.toStudentDTO(s));
  }

  public async getAllocatedStudentsByMethods(
    methods: AllocationMethod[],
  ): Promise<{ student: StudentDTO; project: ProjectDTO }[]> {
    const studentData = await this.db.studentProjectAllocation.findMany({
      where: { ...expand(this.params), allocationMethod: { in: methods } },
      include: {
        student: {
          include: {
            userInInstance: { include: { user: true } },
            studentFlag: true,
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

    return studentData.map((s) => ({
      student: T.toStudentDTO(s.student),
      project: T.toProjectDTO(s.project),
    }));
  }

  get group() {
    this._group ??= new AllocationGroup(this.db, this.params);
    return this._group;
  }

  get subGroup() {
    this._subgroup ??= new AllocationSubGroup(this.db, this.params);
    return this._subgroup;
  }

  public static eq = (a: InstanceDTO, b: InstanceDTO) =>
    a.group === b.group &&
    a.subGroup === b.subGroup &&
    a.instance === b.instance;

  public async setStage(stage: Stage): Promise<void> {
    await this.db.allocationInstance.update({
      where: { instanceId: toInstanceId(this.params) },
      data: { stage },
    });
  }

  /**
   * set whether students can see their allocations
   * @param access
   * @returns the new access state
   */
  public async setStudentPublicationAccess(access: boolean): Promise<boolean> {
    await this.db.allocationInstance.update({
      where: { instanceId: toInstanceId(this.params) },
      data: { studentAllocationAccess: access },
    });
    return access;
  }

  /**
   * set whether supervisors can see their allocations
   * @param access
   * @returns the new access state
   */
  public async setSupervisorPublicationAccess(
    access: boolean,
  ): Promise<boolean> {
    await this.db.allocationInstance.update({
      where: { instanceId: toInstanceId(this.params) },
      data: { supervisorAllocationAccess: access },
    });
    return access;
  }
  public async isReader(id: string): Promise<boolean> {
    return await new User(this.db, id).isReader(this.params);
  }

  public async isSupervisor(userId: string): Promise<boolean> {
    return new User(this.db, userId).isSupervisor(this.params);
  }

  public async getSupervisor(userId: string): Promise<Supervisor> {
    return new User(this.db, userId).toSupervisor(this.params);
  }

  public async isStudent(userId: string): Promise<boolean> {
    return new User(this.db, userId).isStudent(this.params);
  }

  public async getStudent(userId: string): Promise<Student> {
    return new User(this.db, userId).toStudent(this.params);
  }

  public async getStudents(): Promise<StudentDTO[]> {
    const students = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        studentFlag: true,
        userInInstance: { include: { user: true } },
      },
    });

    return students.map((s) => T.toStudentDTO(s));
  }

  // --- side panel tab methods
  public async getAdminTabs() {
    const { stage } = await this.get();
    return ADMIN_TABS_BY_STAGE[stage];
  }

  public async getStudentTabs(canStudentBid: boolean) {
    const { stage, studentAllocationAccess } = await this.get();

    const preferencesTab = canStudentBid ? [PAGES.myPreferences] : [];
    const allocationTab = studentAllocationAccess ? [PAGES.myAllocation] : [];

    const tabs = {
      [Stage.SETUP]: [],
      [Stage.PROJECT_SUBMISSION]: [],
      [Stage.STUDENT_BIDDING]: preferencesTab,
      [Stage.PROJECT_ALLOCATION]: preferencesTab,
      [Stage.ALLOCATION_ADJUSTMENT]: preferencesTab,
      [Stage.ALLOCATION_PUBLICATION]: allocationTab,
      [Stage.READER_BIDDING]: allocationTab,
      [Stage.READER_ALLOCATION]: allocationTab,
      [Stage.MARK_SUBMISSION]: allocationTab,
      [Stage.GRADE_PUBLICATION]: allocationTab,
    };

    return tabs[stage];
  }

  public async getSupervisorTabs(): Promise<TabType[]> {
    const { stage, supervisorAllocationAccess } = await this.get();

    const allocationsTab = supervisorAllocationAccess
      ? [PAGES.mySupervisions]
      : [];

    const tabs = {
      [Stage.SETUP]: [],
      [Stage.PROJECT_SUBMISSION]: [PAGES.myProposedProjects, PAGES.newProject],
      [Stage.STUDENT_BIDDING]: [PAGES.myProposedProjects, PAGES.newProject],
      [Stage.PROJECT_ALLOCATION]: [PAGES.myProposedProjects],
      [Stage.ALLOCATION_ADJUSTMENT]: [PAGES.myProposedProjects],
      [Stage.ALLOCATION_PUBLICATION]: [
        PAGES.myProposedProjects,
        ...allocationsTab,
      ],
      [Stage.READER_BIDDING]: [
        PAGES.myProposedProjects,
        ...allocationsTab,
        PAGES.myMarking,
      ],
      [Stage.READER_ALLOCATION]: [
        PAGES.myProposedProjects,
        ...allocationsTab,
        PAGES.myMarking,
      ],
      [Stage.MARK_SUBMISSION]: [
        PAGES.myProposedProjects,
        ...allocationsTab,
        PAGES.myMarking,
      ],
      [Stage.GRADE_PUBLICATION]: [
        PAGES.myProposedProjects,
        ...allocationsTab,
        PAGES.myMarking,
      ],
    };

    return tabs[stage];
  }

  // ---
  public async getSupervisorSubmissionDetails(): Promise<
    {
      supervisor: SupervisorDTO;
      submittedProjectsCount: number;
      allocatedCount: number;
      submissionTarget: number;
      targetMet: boolean;
    }[]
  > {
    const data = await this.db.supervisorDetails.findMany({
      where: expand(this.params),
      include: {
        projects: { include: { studentAllocations: true } },
        userInInstance: { include: { user: true } },
      },
      orderBy: { userId: "asc" },
    });

    return data.map(({ projects, ...s }) => {
      const allocatedCount = projects
        .map((p) => p.studentAllocations.length)
        .reduce((a, b) => a + b, 0);

      const submissionTarget = computeProjectSubmissionTarget(
        s.projectAllocationTarget,
        allocatedCount,
      );

      return {
        supervisor: T.toSupervisorDTO(s),
        allocatedCount,
        submittedProjectsCount: projects.length,
        submissionTarget,
        targetMet: projects.length >= submissionTarget,
      };
    });
  }

  public async getPreAllocations(): Promise<
    { project: ProjectDTO; supervisor: SupervisorDTO; student: StudentDTO }[]
  > {
    const projectData = await this.db.project.findMany({
      where: { ...expand(this.params), preAllocatedStudentId: { not: null } },
      include: {
        supervisor: {
          include: { userInInstance: { include: { user: true } } },
        },
        flagsOnProject: { include: { flag: true } },
        tagsOnProject: { include: { tag: true } },
      },
    });

    const students = await this.getStudents().then((data) =>
      data.reduce(
        (acc, val) => ({ ...acc, [val.id]: val }),
        {} as Record<string, StudentDTO>,
      ),
    );

    return projectData.map((p) => {
      const student = students[p.preAllocatedStudentId!];
      if (!student) {
        throw new Error(
          `instance.getPreAllocations: dangling pre-allocated student ID ${p.preAllocatedStudentId!}`,
        );
      }

      return {
        project: T.toProjectDTO(p),
        supervisor: T.toSupervisorDTO(p.supervisor),
        student,
      };
    });
  }

  /**
   * @deprecated use getPreAllocations instead
   */
  public async getPreAllocatedStudentIds() {
    const projectData = await this.db.project.findMany({
      where: { ...expand(this.params), preAllocatedStudentId: { not: null } },
    });

    return new Set(
      projectData.map((p) => p.preAllocatedStudentId).filter((p) => p !== null),
    );
  }

  public async getFlagsOnProjects(): Promise<FlagDTO[]> {
    const flagData = await this.db.flagOnProject.findMany({
      where: { project: expand(this.params) },
      include: { flag: true },
    });

    return flagData
      .map((f) => T.toFlagDTO(f.flag))
      .filter(nubsById)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  public async getTagsOnProjects(): Promise<TagDTO[]> {
    const tagData = await this.db.tagOnProject.findMany({
      where: { project: expand(this.params) },
      include: { tag: true },
    });

    return tagData
      .map(({ tag }) => T.toTagDTO(tag))
      .filter(nubsById)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  public getProject(projectId: string): Project {
    return new Project(this.db, { projectId, ...this.params });
  }

  public async getLateProjects(): Promise<ProjectDTO[]> {
    const { projectSubmissionDeadline } = await this.get();

    const projectData = await this.db.project.findMany({
      where: {
        ...expand(this.params),
        latestEditDateTime: { gt: projectSubmissionDeadline },
      },
      include: {
        supervisor: {
          include: { userInInstance: { include: { user: true } } },
        },
        flagsOnProject: { include: { flag: true } },
        tagsOnProject: { include: { tag: true } },
      },
    });

    return projectData.map((x) => T.toProjectDTO(x));
  }

  public async edit({
    instance,
    flags,
    tags,
  }: {
    instance: Omit<
      InstanceDTO,
      "stage" | "supervisorAllocationAccess" | "studentAllocationAccess"
    >;
    flags: FlagDTO[];
    tags: New<TagDTO>[];
  }) {
    const currentInstanceFlags = await this.db.flag.findMany({
      where: expand(this.params),
    });

    const newInstanceFlags = setDiff(
      flags,
      currentInstanceFlags,
      byDisplayName,
    );

    const currentInstanceTags = await this.db.tag.findMany({
      where: expand(this.params),
    });

    const newInstanceTags = setDiff(tags, currentInstanceTags, byTitle);
    const staleInstanceTagTitles = setDiff(
      currentInstanceTags,
      tags,
      byTitle,
    ).map(byTitle);

    await this.db.$transaction(async (tx) => {
      await tx.allocationInstance.update({
        where: { instanceId: toInstanceId(this.params) },
        data: {
          projectSubmissionDeadline: instance.projectSubmissionDeadline,

          minStudentPreferences: instance.minStudentPreferences,
          maxStudentPreferences: instance.maxStudentPreferences,
          maxStudentPreferencesPerSupervisor:
            instance.maxStudentPreferencesPerSupervisor,

          studentPreferenceSubmissionDeadline:
            instance.studentPreferenceSubmissionDeadline,

          minReaderPreferences: instance.minReaderPreferences,
          maxReaderPreferences: instance.maxReaderPreferences,
          readerPreferenceSubmissionDeadline:
            instance.readerPreferenceSubmissionDeadline,
        },
      });

      await tx.flag.createMany({
        data: newInstanceFlags.map((f) => ({
          ...expand(this.params),
          id: f.id,
          displayName: f.displayName,
          description: f.description,
        })),
        skipDuplicates: true,
      });

      const flagData = await this.db.flag.findMany({
        where: expand(this.params),
      });

      const _flagDisplayNameToId = flagData.reduce(
        (acc, val) => ({ ...acc, [val.displayName]: val.id }),
        {} as Record<string, string>,
      );

      // const units = await tx.unitOfAssessment.createManyAndReturn({
      //   data: flags.flatMap((f) =>
      //     f.unitsOfAssessment.map((a) => ({
      //       ...expand(this.params),
      //       flagId: flagDisplayNameToId[f.displayName],
      //       title: a.title,
      //       weight: a.weight,
      //       studentSubmissionDeadline: a.studentSubmissionDeadline,
      //       markerSubmissionDeadline: a.markerSubmissionDeadline,
      //       allowedMarkerTypes: a.allowedMarkerTypes,
      //     })),
      //   ),
      // });

      // const unitTitleToId = units.reduce(
      //   (acc, val) => ({ ...acc, [`${val.flagId}${val.title}`]: val.id }),
      //   {} as Record<string, string>,
      // );

      // await tx.assessmentCriterion.createMany({
      //   data: flags.flatMap((f) =>
      //     f.unitsOfAssessment.flatMap((u) =>
      //       u.components.map((c) => ({
      //         unitOfAssessmentId:
      //           unitTitleToId[
      //             `${flagDisplayNameToId[f.displayName]}${u.title}`
      //           ],
      //         title: c.title,
      //         description: c.description,
      //         weight: c.weight,
      //         layoutIndex: c.layoutIndex,
      //       })),
      //     ),
      //   ),
      // });

      await tx.tag.deleteMany({
        where: {
          ...expand(this.params),
          title: { in: staleInstanceTagTitles },
        },
      });

      await tx.tag.createMany({
        data: newInstanceTags.map((t) => ({
          ...expand(this.params),
          title: t.title,
        })),
      });
    });
  }

  public async clearAllAlgResults(): Promise<void> {
    const preAllocations = await this.getPreAllocations();
    const preAllocatedStudentIds = preAllocations.map((e) => e.student.id);

    await this.db.$transaction([
      this.db.matchingResult.deleteMany({ where: expand(this.params) }),

      this.db.allocationInstance.update({
        where: { instanceId: toInstanceId(this.params) },
        data: { selectedAlgId: null },
      }),

      this.db.studentProjectAllocation.deleteMany({
        where: {
          ...expand(this.params),
          userId: { notIn: preAllocatedStudentIds },
        },
      }),
    ]);
  }

  public async clearAlgSelection(): Promise<void> {
    const preAllocatedStudentIds = await this.getPreAllocations().then((d) =>
      d.map((d) => d.student.id),
    );

    await this.db.$transaction([
      this.db.studentProjectAllocation.deleteMany({
        where: {
          ...expand(this.params),
          userId: { notIn: preAllocatedStudentIds },
        },
      }),

      this.db.allocationInstance.update({
        where: { instanceId: toInstanceId(this.params) },
        data: { selectedAlgId: null },
      }),
    ]);
  }

  public async selectAlg(algId: string): Promise<void> {
    const preAllocatedStudentIds = await this.getPreAllocations().then((data) =>
      data.map(({ student: { id } }) => id),
    );

    const matchingData = await this.db.matchingResult.findFirst({
      where: { ...expand(this.params), algorithmId: algId },
      include: { matching: true },
    });

    await this.db.$transaction([
      this.db.studentProjectAllocation.deleteMany({
        where: {
          ...expand(this.params),
          userId: { notIn: preAllocatedStudentIds },
        },
      }),

      this.db.studentProjectAllocation.createMany({
        data: matchingData?.matching ?? [],
      }),

      this.db.allocationInstance.update({
        where: { instanceId: toInstanceId(this.params) },
        data: { selectedAlgId: algId },
      }),
    ]);
  }

  public async unlinkUser(userId: string): Promise<void> {
    await this.db.userInInstance.delete({
      where: { instanceMembership: { ...expand(this.params), userId } },
    });
  }

  public async unlinkUsers(userIds: string[]): Promise<void> {
    await this.db.userInInstance.deleteMany({
      where: { ...expand(this.params), userId: { in: userIds } },
    });
  }

  // TODO split into 2 methods
  public async unlinkStudent(userId: string) {
    await this.db.$transaction([
      this.db.project.updateMany({
        where: { preAllocatedStudentId: userId, ...expand(this.params) },
        data: { preAllocatedStudentId: null },
      }),
      this.db.userInInstance.delete({
        where: { instanceMembership: { ...expand(this.params), userId } },
      }),
    ]);
  }

  public async unlinkStudents(studentIds: string[]) {
    await this.db.$transaction([
      this.db.project.updateMany({
        where: {
          preAllocatedStudentId: { in: studentIds },
          ...expand(this.params),
        },
        data: { preAllocatedStudentId: null },
      }),
      this.db.userInInstance.deleteMany({
        where: { ...expand(this.params), userId: { in: studentIds } },
      }),
    ]);
  }

  public async deleteStudent(userId: string): Promise<void> {
    await this.db.studentDetails.delete({
      where: { studentDetailsId: { userId, ...expand(this.params) } },
    });
  }

  public async deleteManyStudents(userIds: string[]): Promise<void> {
    await this.db.studentDetails.deleteMany({
      where: { userId: { in: userIds }, ...expand(this.params) },
    });
  }

  public async deleteSupervisor(userId: string): Promise<void> {
    await this.db.supervisorDetails.delete({
      where: { supervisorDetailsId: { userId, ...expand(this.params) } },
    });
  }

  public async deleteManySupervisors(userIds: string[]): Promise<void> {
    await this.db.supervisorDetails.deleteMany({
      where: { userId: { in: userIds }, ...expand(this.params) },
    });
  }

  public async deleteStudentAllocation(userId: string): Promise<void> {
    await this.db.studentProjectAllocation.deleteMany({
      where: { ...expand(this.params), userId },
    });
  }

  public async deleteProjects(projectIds: string[]) {
    await this.db.project.deleteMany({
      where: { ...expand(this.params), id: { in: projectIds } },
    });
  }

  public async delete() {
    await this.db.allocationInstance.delete({
      where: { instanceId: toInstanceId(this.params) },
    });
  }
}
