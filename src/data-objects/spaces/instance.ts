import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import { SupervisorProjectSubmissionDetails } from "@/lib/validations/supervisor-project-submission-details";
import { TabType } from "@/lib/validations/tabs";

import { Algorithm } from "../algorithm";
import { DataObject } from "../data-object";
import { StudentProjectAllocationData } from "../student-project-allocation-data";
import { User } from "../users/user";

import { AllocationGroup } from "./group";
import { AllocationSubGroup } from "./subgroup";

import { PAGES } from "@/config/pages";
import { ADMIN_TABS_BY_STAGE } from "@/config/side-panel-tabs/admin-tabs-by-stage";
import { computeProjectSubmissionTarget } from "@/config/submission-target";
import { DAL } from "@/data-access";
import { allocationInstanceToDTO } from "@/db/transformers";
import { DB, Stage } from "@/db/types";
import { InstanceDisplayData, InstanceDTO } from "@/dto";

export class AllocationInstance extends DataObject {
  public params: InstanceParams;
  private _group: AllocationGroup | undefined;
  private _subgroup: AllocationSubGroup | undefined;
  private _data: InstanceDTO | undefined;

  constructor(dal: DAL, db: DB, params: InstanceParams) {
    super(dal, db);
    this.params = params;
  }

  static async toQualifiedPaths(
    dal: DAL,
    instances: InstanceDTO[],
  ): Promise<InstanceDisplayData[]> {
    return await dal.instance.toQualifiedPaths(instances);
  }

  public async exists() {
    return await this.dal.instance.exists(this.params);
  }

  public async get(refetch = false) {
    if (refetch || !this._data) {
      this._data = await this.dal.instance.get(this.params);
    }

    return this._data;
  }

  public async getStudentProjectAllocation() {
    return await StudentProjectAllocationData.fromDB(this.params);
  }

  public async getParentInstance(): Promise<AllocationInstance> {
    const { parentInstanceId } = await this.get();

    if (!parentInstanceId) throw new Error("No parent instance found");

    return new AllocationInstance(this.dal, this.db, {
      ...this.params,
      instance: parentInstanceId,
    });
  }

  public async getChildInstance() {
    const childData = await this.dal.db.allocationInstance.findFirst({
      where: {
        parentInstanceId: this.params.instance,
        allocationGroupId: this.params.group,
        allocationSubGroupId: this.params.subGroup,
      },
    });

    if (!childData) return undefined;

    const childInstance = new AllocationInstance(this.dal, this.db, {
      ...this.params,
      instance: childData.id,
    });

    childInstance._data = allocationInstanceToDTO(childData);

    return childInstance;
  }

  // TODO review the nullish behaviour here
  public async getSelectedAlg(): Promise<Algorithm | undefined> {
    const { selectedAlgName: id } = await this.get();
    if (id) return new Algorithm(this.dal, this.db, id);
    else return undefined;
  }

  public async getAllocationData() {
    return await StudentProjectAllocationData.fromDB(this.params);
  }

  public async getFlags() {
    return await this.dal.instance.getFlags(this.params);
  }

  public async getTags() {
    return await this.dal.instance.getTags(this.params);
  }

  public async getSupervisors() {
    return await this.dal.instance.getSupervisors(this.params);
  }

  public async getSupervisorDetails() {
    return await this.dal.instance.getSupervisorDetails(this.params);
  }

  public async getStudentDetails() {
    const students = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
      },
    });

    return students.map((u) => ({
      institutionId: u.userId,
      fullName: u.userInInstance.user.name,
      email: u.userInInstance.user.email,
      joined: u.userInInstance.joined,
      level: u.studentLevel,
    }));
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
        projectAllocation: {
          select: {
            project: {
              select: {
                details: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return students.map((u) => ({
      institutionId: u.userId,
      fullName: u.userInInstance.user.name,
      email: u.userInInstance.user.email,
      joined: u.userInInstance.joined,
      level: u.studentLevel,
      allocatedProject: u.projectAllocation?.project.details,
    }));
  }

  public async getSubmittedPreferences() {
    return await this.db.studentSubmittedPreference
      .findMany({
        where: expand(this.params),
        include: {
          project: {
            include: {
              details: {
                include: { tagsOnProject: { include: { tag: true } } },
              },
            },
          },
        },
        orderBy: [{ projectId: "asc" }, { rank: "asc" }, { userId: "asc" }],
      })
      .then((data) =>
        data.map((p) => ({
          studentId: p.userId,
          rank: p.rank,
          project: { id: p.projectId, title: p.project.details.title },
          supervisorId: p.project.supervisorId,
          tags: p.project.details.tagsOnProject.map((t) => t.tag),
        })),
      );
  }

  get group() {
    if (!this._group)
      this._group = new AllocationGroup(this.dal, this.db, this.params);
    return this._group;
  }

  get subGroup() {
    if (!this._subgroup)
      this._subgroup = new AllocationSubGroup(this.dal, this.db, this.params);
    return this._subgroup;
  }

  public static eq = (a: InstanceDTO, b: InstanceDTO) =>
    a.group === b.group &&
    a.subGroup === b.subGroup &&
    a.instance === b.instance;

  public async setStage(stage: Stage) {
    this.dal.instance.setStage(this.params, stage);
  }

  /**
   * @deprecated
   */
  async getStudentAccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // TODO: rename
  async setStudentAccess(_access: boolean): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  /**
   * @deprecated
   */
  async getSupervisorAccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // TODO rename
  async setSupervisorAccess(access: boolean): Promise<boolean> {
    return await this.dal.instance.setSupervisorProjectAllocationAccess(
      access,
      this.params,
    );
  }

  /**
   * @deprecated
   */
  public async getReaderAccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  // TODO rename
  public async setReaderAccess(_access: boolean): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public isSupervisor(userId: string) {
    return new User(this.dal, this.db, userId).isInstanceSupervisor(
      this.params,
    );
  }

  public getSupervisor(userId: string) {
    return new User(this.dal, this.db, userId).toInstanceSupervisor(
      this.params,
    );
  }

  public isStudent(userId: string) {
    return new User(this.dal, this.db, userId).isInstanceStudent(this.params);
  }

  public getStudent(userId: string) {
    return new User(this.dal, this.db, userId).toInstanceStudent(this.params);
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
      [Stage.ALLOCATION_PUBLICATION]: [PAGES.myProjects, ...allocationsTab],
      [Stage.READER_BIDDING]: [PAGES.myProjects, ...allocationsTab],
      [Stage.READER_ALLOCATION]: [PAGES.myProjects, ...allocationsTab],
      [Stage.MARK_SUBMISSION]: [PAGES.myProjects, ...allocationsTab],
      [Stage.GRADE_PUBLICATION]: [PAGES.myProjects, ...allocationsTab],
    };

    return tabs[stage];
  }

  // ---

  public async getSupervisorSubmissionDetails(): Promise<
    SupervisorProjectSubmissionDetails[]
  > {
    const data = await this.dal.db.supervisorDetails.findMany({
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

  public async getPreAllocatedStudentIds() {
    const projectData = await this.db.projectInInstance.findMany({
      where: {
        ...expand(this.params),
        details: { preAllocatedStudentId: { not: null } },
      },
      select: { details: { select: { preAllocatedStudentId: true } } },
    });

    return new Set(
      projectData
        .map((p) => p.details.preAllocatedStudentId)
        .filter((p) => p !== null),
    );
  }

  public async deleteUser(userId: string) {
    await this.dal.user.deleteInInstance(userId, this.params);
  }

  public async deleteUsers(userIds: string[]) {
    await this.dal.user.deleteManyInInstance(userIds, this.params);
  }

  public async deleteStudent(studentId: string): Promise<void> {
    return await this.dal.student.delete(studentId, this.params);
  }

  public async deleteStudents(studentIds: string[]): Promise<void> {
    return await this.dal.student.deleteMany(studentIds, this.params);
  }

  public async deleteSupervisor(supervisorId: string): Promise<void> {
    return await this.dal.supervisor.delete(supervisorId, this.params);
  }

  public async deleteSupervisors(supervisorIds: string[]): Promise<void> {
    return await this.dal.supervisor.deleteMany(supervisorIds, this.params);
  }

  public async delete() {
    await this.dal.instance.delete(this.params);
  }
}
