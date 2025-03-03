import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { setDiff } from "@/lib/utils/general/set-difference";
import { AlgorithmDTO } from "@/dto/algorithm";
import { RandomAllocationDto } from "@/lib/validations/allocation/data-table-dto";
import { UpdatedInstance } from "@/lib/validations/instance-form";
import { InstanceParams } from "@/lib/validations/params";
import { SupervisorProjectSubmissionDetails } from "@/lib/validations/supervisor-project-submission-details";
import { TabType } from "@/lib/validations/tabs";

import { MatchingAlgorithm } from "../algorithm";
import { DataObject } from "../data-object";
import { StudentProjectAllocationData } from "../student-project-allocation-data";
import { User } from "../users/user";

import { AllocationGroup } from "./group";
import { AllocationSubGroup } from "./subgroup";

import { PAGES } from "@/config/pages";
import { ADMIN_TABS_BY_STAGE } from "@/config/side-panel-tabs/admin-tabs-by-stage";
import { computeProjectSubmissionTarget } from "@/config/submission-target";
import { collectMatchingData } from "@/db/transactions/collect-matching-data";
import { DB, Stage } from "@/db/types";
import {
  FlagDTO,
  InstanceDisplayData,
  InstanceDTO,
  TagDTO,
  UserDTO,
} from "@/dto";
import { ProjectDTO } from "@/dto/project";
import { StudentDTO } from "@/dto/user/student";
import { SupervisorDTO } from "@/dto/user/supervisor";
import { Transformers as T } from "@/db/transformers";
import { InstanceSupervisor } from "../users/instance-supervisor";
import { InstanceStudent } from "../users/instance-student";
import { Project } from "./project";

export class AllocationInstance extends DataObject {
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
      where: expand(this.params),
    }));
  }

  public async get(refetch = false): Promise<InstanceDTO> {
    if (refetch || !this._data) {
      this._data = await this.db.allocationInstance
        .findFirstOrThrow({ where: expand(this.params) })
        .then(T.toAllocationInstanceDTO);
    }

    return this._data!;
  }

  public async getAllocationData(): Promise<StudentProjectAllocationData> {
    return await StudentProjectAllocationData.fromDB(this.db, this.params);
  }

  public async getParentInstance(): Promise<AllocationInstance> {
    const { parentInstanceId } = await this.get();

    if (!parentInstanceId) throw new Error("No parent instance found");

    return new AllocationInstance(this.db, {
      ...this.params,
      instance: parentInstanceId,
    });
  }

  public async getChildInstance(): Promise<AllocationInstance | undefined> {
    const childData = await this.db.allocationInstance.findFirst({
      where: {
        parentInstanceId: this.params.instance,
        allocationGroupId: this.params.group,
        allocationSubGroupId: this.params.subGroup,
      },
    });

    if (!childData) return undefined;

    const childInstance = new AllocationInstance(this.db, {
      ...this.params,
      instance: childData.id,
    });

    childInstance._data = T.toAllocationInstanceDTO(childData);

    return childInstance;
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
      .then(T.toAlgorithmDTO);
  }

  public async getMatchingData() {
    const instanceData = await this.get();
    return await collectMatchingData(this.db, instanceData);
  }

  public async getAllAlgorithms(): Promise<AlgorithmDTO[]> {
    const algs = await this.db.algorithm.findMany({
      where: expand(this.params),
      orderBy: { createdAt: "asc" },
    });

    return algs.map(T.toAlgorithmDTO);
  }

  public getAlgorithm(algConfigId: string): MatchingAlgorithm {
    return new MatchingAlgorithm(this.db, { algConfigId, ...this.params });
  }

  // TODO review the nullish behaviour here
  public async getSelectedAlg(): Promise<MatchingAlgorithm | undefined> {
    const { selectedAlgConfigId: algConfigId } = await this.get();

    if (!algConfigId) return undefined;
    return new MatchingAlgorithm(this.db, { algConfigId, ...this.params });
  }

  // ---------------------------------------------------------------------------

  public async getFlags(): Promise<FlagDTO[]> {
    return await this.db.flag.findMany({ where: expand(this.params) });
  }

  public async getTags(): Promise<TagDTO[]> {
    return await this.db.tag.findMany({ where: expand(this.params) });
  }

  public async getProjectDetails(): Promise<
    { project: ProjectDTO; supervisor: SupervisorDTO; allocatedTo: string[] }[]
  > {
    const projectData = await this.db.project.findMany({
      where: expand(this.params),
      include: {
        studentAllocations: true,
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
        studentLevel: s.level,
      })),
      skipDuplicates: true,
    });
  }

  public async getSupervisors(): Promise<SupervisorDTO[]> {
    const supervisorData = await this.db.supervisorDetails.findMany({
      where: expand(this.params),
      include: { userInInstance: { include: { user: true } } },
    });

    return supervisorData.map(T.toSupervisorDTO);
  }

  public async getSupervisorProjectDetails() {
    const supervisors = await this.db.supervisorDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
        projects: { include: { studentAllocations: true } },
      },
    });

    return supervisors.map(({ userInInstance, ...s }) => ({
      institutionId: userInInstance.user.id,
      fullName: userInInstance.user.name,
      email: userInInstance.user.email,
      joined: userInInstance.joined,
      projectTarget: s.projectAllocationTarget,
      projectUpperQuota: s.projectAllocationUpperBound,
      projects: s.projects.map((p) => ({
        id: p.id,
        title: p.title,
        allocatedTo: p.studentAllocations.map((a) => a.userId),
      })),
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

  public async getStudentPreferenceDetails() {
    const students = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
        studentDraftPreferences: true,
        studentSubmittedPreferences: true,
      },
    });

    return students.map((u) => ({
      institutionId: u.userId,
      fullName: u.userInInstance.user.name,
      email: u.userInInstance.user.email,
      joined: u.userInInstance.joined,
      level: u.studentLevel,
      draftPreferences: u.studentDraftPreferences,
      submittedPreferences: u.studentSubmittedPreferences,
    }));
  }

  public async getStudentAllocationDetails() {
    const students = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
        projectAllocation: { include: { project: true } },
      },
    });

    return students.map((u) => ({
      institutionId: u.userId,
      fullName: u.userInInstance.user.name,
      email: u.userInInstance.user.email,
      joined: u.userInInstance.joined,
      level: u.studentLevel,
      allocatedProject: u.projectAllocation?.project,
    }));
  }

  public async getStudentSuitableProjects(
    userId: string,
  ): Promise<{ id: string; title: string; flag: FlagDTO[] }[]> {
    const { studentFlags } = await this.db.studentDetails.findFirstOrThrow({
      where: { ...expand(this.params), userId },
      include: { studentFlags: true },
    });

    const suitableProjects = await this.db.project.findMany({
      where: {
        ...expand(this.params),
        flagsOnProject: {
          some: { flagId: { in: studentFlags.map((f) => f.flagId) } },
        },
      },
      include: {
        flagsOnProject: { select: { flag: true } },
        studentAllocations: true,
      },
    });

    return suitableProjects
      .filter((p) => p.studentAllocations.length === 0)
      .map((p) => ({
        id: p.id,
        title: p.title,
        flag: p.flagsOnProject.map((f) => T.toFlagDTO(f.flag)),
      }));
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
        studentFlags: { include: { flag: true } },
        userInInstance: { include: { user: true } },
      },
    });

    return studentData.map((s) => T.toStudentDTO(s));
  }

  // BREAKING
  public async getStudentsForRandomAllocation(): Promise<
    RandomAllocationDto[]
  > {
    const { selectedAlgConfigId } = await this.get();

    const students = await this.db.studentDetails
      .findMany({
        where: expand(this.params),
        include: {
          userInInstance: { select: { user: true } },
          projectAllocation: { select: { project: true } },
        },
      })
      .then((d) =>
        d.map((s) => ({
          student: { ...s.userInInstance.user, level: s.studentLevel },
          project: s.projectAllocation?.project
            ? {
                id: s.projectAllocation?.project.id,
                title: s.projectAllocation?.project.title,
              }
            : undefined,
        })),
      );

    const matchedStudentIds = await this.db.matchingResult
      .findFirstOrThrow({
        where: { ...expand(this.params), algorithmId: selectedAlgConfigId },
        include: { matching: true },
      })
      .then((x) => new Set(x.matching.map((m) => m.userId)));

    return students.filter((s) => !matchedStudentIds.has(s.student.id));
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.db, this.params);
    return this._group;
  }

  get subGroup() {
    if (!this._subgroup)
      this._subgroup = new AllocationSubGroup(this.db, this.params);
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
  async setStudentPublicationAccess(access: boolean): Promise<boolean> {
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
  async setSupervisorPublicationAccess(access: boolean): Promise<boolean> {
    await this.db.allocationInstance.update({
      where: { instanceId: toInstanceId(this.params) },
      data: { supervisorAllocationAccess: access },
    });
    return access;
  }

  public isSupervisor(userId: string): Promise<boolean> {
    return new User(this.db, userId).isInstanceSupervisor(this.params);
  }

  public getSupervisor(userId: string): InstanceSupervisor {
    return new User(this.db, userId).toInstanceSupervisor(this.params);
  }

  public isStudent(userId: string): Promise<boolean> {
    return new User(this.db, userId).isInstanceStudent(this.params);
  }

  public getStudent(userId: string): Promise<InstanceStudent> {
    return new User(this.db, userId).toInstanceStudent(this.params);
  }

  public async getStudents(): Promise<StudentDTO[]> {
    const students = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        studentFlags: { include: { flag: true } },
        userInInstance: { include: { user: true } },
      },
    });

    return students.map((s) => T.toStudentDTO(s));
  }

  // --- side panel tab methods

  public async getAdminTabs() {
    const { stage, parentInstanceId } = await this.get();
    const stageTabs = ADMIN_TABS_BY_STAGE[stage];

    if (stage === Stage.ALLOCATION_PUBLICATION) {
      if (parentInstanceId) {
        return stageTabs.toSpliced(3, 0, PAGES.mergeInstance);
      }

      const notForked = !(await this.getChildInstance());
      if (notForked) {
        return stageTabs.toSpliced(3, 0, PAGES.forkInstance);
      }
    }

    return stageTabs;
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
      ? [PAGES.myAllocations]
      : [];

    const tabs = {
      [Stage.SETUP]: [],
      [Stage.PROJECT_SUBMISSION]: [PAGES.myProjects, PAGES.newProject],
      [Stage.STUDENT_BIDDING]: [PAGES.myProjects, PAGES.newProject],
      [Stage.PROJECT_ALLOCATION]: [PAGES.myProjects],
      [Stage.ALLOCATION_ADJUSTMENT]: [PAGES.myProjects],
      [Stage.ALLOCATION_PUBLICATION]: [
        PAGES.myProjects,
        PAGES.myReadings,
        PAGES.myMarking,
        ...allocationsTab,
      ],
      [Stage.READER_BIDDING]: [
        PAGES.myProjects,
        PAGES.myReadings,
        PAGES.myMarking,
        ...allocationsTab,
      ],
      [Stage.READER_ALLOCATION]: [
        PAGES.myProjects,
        PAGES.myReadings,
        PAGES.myMarking,
        ...allocationsTab,
      ],
      [Stage.MARK_SUBMISSION]: [
        PAGES.myProjects,
        PAGES.myReadings,
        PAGES.myMarking,
        ...allocationsTab,
      ],
      [Stage.GRADE_PUBLICATION]: [
        PAGES.myProjects,
        PAGES.myReadings,
        PAGES.myMarking,
        ...allocationsTab,
      ],
    };

    return tabs[stage];
  }

  // ---

  public async getSupervisorSubmissionDetails(): Promise<
    SupervisorProjectSubmissionDetails[]
  > {
    const data = await this.db.supervisorDetails.findMany({
      where: expand(this.params),
      include: {
        projects: { include: { studentAllocations: true } },
        userInInstance: { include: { user: true } },
      },
      orderBy: { userId: "asc" },
    });

    return data.map(({ projects, projectAllocationTarget, ...s }) => {
      const allocatedCount = projects
        .map((p) => p.studentAllocations.length)
        .reduce((a, b) => a + b, 0);

      return {
        userId: s.userInInstance.user.id,
        name: s.userInInstance.user.name,
        email: s.userInInstance.user.email,
        projectAllocationTarget,
        allocatedCount,
        submittedProjectsCount: projects.length,
        submissionTarget: computeProjectSubmissionTarget(
          projectAllocationTarget,
          allocatedCount,
        ),
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

    return flagData.map((f) => T.toFlagDTO(f.flag));
  }

  public async getTagsOnProjects(): Promise<TagDTO[]> {
    const tagData = await this.db.tagOnProject.findMany({
      where: { project: expand(this.params) },
      include: { tag: true },
    });

    return tagData.map(({ tag }) => T.toTagDTO(tag));
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

    return projectData.map(T.toProjectDTO);
  }

  public async edit({ flags, tags, ...updatedData }: UpdatedInstance) {
    const currentInstanceFlags = await this.db.flag.findMany({
      where: expand(this.params),
    });

    const newInstanceFlags = setDiff(flags, currentInstanceFlags, byTitle);
    const staleInstanceFlagTitles = setDiff(
      currentInstanceFlags,
      flags,
      byTitle,
    ).map(byTitle);

    const currentInstanceTags = await this.db.tag.findMany({
      where: expand(this.params),
    });

    const newInstanceTags = setDiff(tags, currentInstanceTags, byTitle);
    const staleInstanceTagTitles = setDiff(
      currentInstanceTags,
      tags,
      byTitle,
    ).map(byTitle);

    await this.db.$transaction([
      this.db.allocationInstance.update({
        where: { instanceId: toInstanceId(this.params) },
        data: updatedData,
      }),

      this.db.flag.deleteMany({
        where: {
          ...expand(this.params),
          title: { in: staleInstanceFlagTitles },
        },
      }),

      this.db.flag.createMany({
        data: newInstanceFlags.map((f) => ({
          ...expand(this.params),
          title: f.title,
          description: "",
        })),
      }),

      this.db.tag.deleteMany({
        where: {
          ...expand(this.params),
          title: { in: staleInstanceTagTitles },
        },
      }),

      this.db.tag.createMany({
        data: newInstanceTags.map((t) => ({
          ...expand(this.params),
          title: t.title,
        })),
      }),
    ]);
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

  public async deleteSupervisor(userId: string): Promise<void> {
    await this.db.supervisorDetails.delete({
      where: { supervisorDetailsId: { userId, ...expand(this.params) } },
    });
  }

  public async deleteSupervisors(userIds: string[]): Promise<void> {
    await this.db.supervisorDetails.deleteMany({
      where: { userId: { in: userIds }, ...expand(this.params) },
    });
  }

  public async deleteStudentAllocation(userId: string): Promise<void> {
    const spaId = { ...expand(this.params), userId };

    await this.db.$transaction([
      this.db.studentProjectAllocation.deleteMany({ where: spaId }),
      this.db.studentSubmittedPreference.deleteMany({ where: spaId }),
    ]);
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

// MOVE not sure where though
const byTitle = <T extends { title: string }>({ title }: T) => title;
