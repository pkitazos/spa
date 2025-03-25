import { DB, MarkerType, PreferenceType } from "@/db/types";

import { expand } from "@/lib/utils/general/instance-params";
import { ValidatedSegments } from "@/lib/validations/breadcrumbs";
import {
  GroupParams,
  InstanceParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { Transformers as T } from "@/db/transformers";
import { Role } from "@/db/types";

import { slugify } from "@/lib/utils/general/slugify";
import { uniqueById } from "@/lib/utils/list-unique";

import { toInstanceId } from "@/lib/utils/general/instance-params";

import { New } from "@/db/types";

import {
  FlagDTO,
  TagDTO,
  InstanceDisplayData,
  ReaderDTO,
  ProjectDTO,
  StudentDTO,
  SupervisorDTO,
  AlgorithmDTO,
  builtInAlgorithms,
  NewUnitOfAssessmentDTO,
  UnitOfAssessmentDTO,
  AssessmentCriterionWithScoreDTO,
} from "@/dto/";

import {
  SuperAdminDTO,
  GroupDTO,
  SubGroupDTO,
  InstanceDTO,
  InstanceUserDTO,
  UserDTO,
} from "@/dto";

import { AlgorithmRunResult } from "@/dto/result/algorithm-run-result";

import { setDiff } from "@/lib/utils/general/set-difference";
import { RandomAllocationDto } from "@/lib/validations/allocation/data-table-dto";
import { SupervisorProjectSubmissionDetails } from "@/lib/validations/supervisor-project-submission-details";
import { TabType } from "@/lib/validations/tabs";

import { PAGES } from "@/config/pages";
import { ADMIN_TABS_BY_STAGE } from "@/config/side-panel-tabs/admin-tabs-by-stage";
import { computeProjectSubmissionTarget } from "@/config/submission-target";
import { collectMatchingData } from "@/db/transactions/collect-matching-data";
import { Stage } from "@/db/types";
import { toPP2 } from "@/lib/utils/general/instance-params";
import { ProjectParams } from "@/lib/validations/params";

import { toAlgID } from "@/lib/utils/general/instance-params";
import {
  blankResult,
  MatchingDataDTO,
  MatchingResultDTO,
} from "@/lib/validations/matching";
import { AlgorithmInstanceParams } from "@/lib/validations/params";
import { executeMatchingAlgorithm } from "@/server/routers/institution/instance/algorithm/_utils/execute-matching-algorithm";
import { Transformers } from "@/db/transformers";
import { sortPreferenceType } from "@/lib/utils/sorting/by-preference-type";
import { ProjectPreferenceCardDto } from "@/lib/validations/board";
import { updatePreferenceTransaction } from "@/db/transactions/update-preference";
import { updateManyPreferenceTransaction } from "@/db/transactions/update-many-preferences";
import { guidToMatric } from "@/config/guid-to-matric";

// ----------------------------------------------------------------
export abstract class DataObject {
  protected db: DB;

  constructor(db: DB) {
    this.db = db;
  }
}

export class User extends DataObject {
  id: string;
  private _data: UserDTO | undefined;

  constructor(db: DB, id: string) {
    super(db);
    this.id = id;
  }

  public async toDTO(): Promise<UserDTO> {
    if (!this._data) {
      this._data = await this.db.user.findFirstOrThrow({
        where: { id: this.id },
      });
    }
    return this._data;
  }

  static fromDTO(db: DB, data: UserDTO) {
    const user = new User(db, data.id);
    user._data = data;
  }

  // --- kind checks:

  public async isSuperAdmin(): Promise<boolean> {
    return !!(await this.db.superAdmin.findFirst({
      where: { userId: this.id },
    }));
  }

  public async isGroupAdmin(groupParams: GroupParams): Promise<boolean> {
    return !!(await this.db.groupAdmin.findFirst({
      where: { userId: this.id, allocationGroupId: groupParams.group },
    }));
  }

  public async isSubGroupAdmin(
    subGroupParams: SubGroupParams,
  ): Promise<boolean> {
    return !!(await this.db.subGroupAdmin.findFirst({
      where: {
        userId: this.id,
        allocationSubGroupId: subGroupParams.subGroup,
        allocationGroupId: subGroupParams.group,
      },
    }));
  }

  public async isGroupAdminOrBetter(params: GroupParams): Promise<boolean> {
    return (await this.isSuperAdmin()) || (await this.isGroupAdmin(params));
  }

  public async isSubGroupAdminOrBetter(
    params: SubGroupParams,
  ): Promise<boolean> {
    return (
      (await this.isGroupAdminOrBetter({ group: params.group })) ||
      (await this.isSubGroupAdmin(params))
    );
  }

  public async isStudent(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.studentDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public async isSupervisor(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.supervisorDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public async isProjectSupervisor(id: string): Promise<boolean> {
    return !!(await this.db.project.findFirst({
      where: { id, supervisorId: this.id },
    }));
  }

  public async isReader(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.readerDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public async isMarker(params: InstanceParams): Promise<boolean> {
    return (await this.isSupervisor(params)) || (await this.isReader(params));
  }

  public async isStaff(params: InstanceParams): Promise<boolean> {
    return (
      (await this.isSubGroupAdminOrBetter(params)) ||
      (await this.isMarker(params))
    );
  }

  public async isMember(params: InstanceParams): Promise<boolean> {
    return (await this.isStaff(params)) || (await this.isStudent(params));
  }

  public async getRolesInInstance(
    instanceParams: InstanceParams,
  ): Promise<Set<Role>> {
    const roles = new Set<Role>();

    if (await this.isSubGroupAdminOrBetter(instanceParams)) {
      roles.add(Role.ADMIN);
    }
    if (await this.isStudent(instanceParams)) {
      roles.add(Role.STUDENT);
    }
    if (await this.isReader(instanceParams)) {
      roles.add(Role.READER);
    }
    if (await this.isSupervisor(instanceParams)) {
      roles.add(Role.SUPERVISOR);
    }

    return roles;
  }

  // --- conversions

  public toUser(): User {
    return new User(this.db, this.id);
  }

  public async toSuperAdmin(): Promise<SuperAdmin> {
    if (!(await this.isSuperAdmin())) throw new Error("unauthorised");
    return new SuperAdmin(this.db, this.id);
  }

  public async toGroupAdmin(groupParams: GroupParams): Promise<GroupAdmin> {
    if (!(await this.isGroupAdminOrBetter(groupParams)))
      throw new Error("unauthorised");
    return new GroupAdmin(this.db, this.id, groupParams);
  }

  public async toSubGroupAdmin(
    subGroupParams: SubGroupParams,
  ): Promise<SubGroupAdmin> {
    if (!(await this.isSubGroupAdminOrBetter(subGroupParams)))
      throw new Error("unauthorised");
    return new SubGroupAdmin(this.db, this.id, subGroupParams);
  }

  public async toStudent(instanceParams: InstanceParams): Promise<Student> {
    if (!(await this.isStudent(instanceParams)))
      throw new Error("unauthorised");

    return new Student(this.db, this.id, instanceParams);
  }

  public async toSupervisor(
    instanceParams: InstanceParams,
  ): Promise<Supervisor> {
    if (!(await this.isSupervisor(instanceParams)))
      throw new Error("User is not a supervisor in this instance");

    return new Supervisor(this.db, this.id, instanceParams);
  }

  public async toReader(instanceParams: InstanceParams): Promise<Reader> {
    if (!(await this.isReader(instanceParams))) throw new Error("unauthorised");

    return new Reader(this.db, this.id, instanceParams);
  }

  public async toMarker(instanceParams: InstanceParams): Promise<Marker> {
    if (!(await this.isMarker(instanceParams))) throw new Error("unauthorised");

    return new Marker(this.db, this.id, instanceParams);
  }

  // --- Other methods
  public async hasSelfDefinedProject(instanceParams: InstanceParams) {
    if (!(await this.isStudent(instanceParams))) return false;

    return await this.toStudent(instanceParams).then((s) =>
      s.hasSelfDefinedProject(),
    );
  }

  // TODO return type
  // that formatting should live elsewhere
  public async getManagedGroups() {
    const groups = await this.db.allocationGroup.findMany({
      where: { groupAdmins: { some: { userId: this.id } } },
    });

    return groups.map(({ displayName, id }) => ({
      displayName: displayName,
      path: `/${id}`,
    }));
  }

  // TODO REVIEW; I fixed the bug but I am not sure if I did it right
  // TODO return type wth is that?
  public async getManagedSubGroups() {
    const subgroups = await this.db.allocationSubGroup.findMany({
      where: {
        OR: [
          { subGroupAdmins: { some: { userId: this.id } } },
          { allocationGroup: { groupAdmins: { some: { userId: this.id } } } },
        ],
      },
    });

    return subgroups.map(({ displayName, allocationGroupId, id }) => ({
      displayName: displayName,
      path: `/${allocationGroupId}/${id}`,
    }));
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    if (await this.isSuperAdmin()) {
      return await new Institution(this.db).getInstances();
    }

    const instanceData = await this.db.allocationInstance.findMany({
      where: {
        OR: [
          { users: { some: { userId: this.id } } },
          {
            allocationSubGroup: {
              subGroupAdmins: { some: { userId: this.id } },
            },
          },
          {
            allocationSubGroup: {
              allocationGroup: { groupAdmins: { some: { userId: this.id } } },
            },
          },
        ],
      },
    });

    return instanceData.map(T.toAllocationInstanceDTO);
  }

  public async authoriseBreadcrumbs(segments: string[]) {
    const [group, subGroup, instance, staticSegment, id] = segments;
    const res: ValidatedSegments[] = [];

    if (group) {
      res.push({
        segment: group,
        access: await this.isGroupAdminOrBetter({ group }),
      });
    }
    if (group && subGroup) {
      res.push({
        segment: subGroup,
        access: await this.isSubGroupAdminOrBetter({ group, subGroup }),
      });
    }
    if (group && subGroup && instance) {
      res.push({
        segment: instance,
        access: await this.isMember({ group, subGroup, instance }),
      });
    }

    // TODO: this doesn't yet handle users access to the /supervisors/[id] and /students/[id] routes (possibly going to be a new /readers/[id] route)
    // users who don't have access to those pages should still see the breadcrumbs with the correct permissions to be able to navigate back to their allowed pages

    // @pkitazos here's is a skeleton implementation - just needs you to implement the rules for when access is possible
    if (staticSegment) {
      res.push({ segment: staticSegment, access: true });
    }

    if (id) {
      switch (staticSegment) {
        case "projects":
          res.push({ segment: id, access: true });
          break;

        case "students":
          res.push({ segment: id, access: true });
          break;

        case "supervisors":
          res.push({ segment: id, access: true });
          break;

        case "readers":
          res.push({ segment: id, access: true });
          break;

        default:
          throw new Error(
            `User.AuthoriseBreadcrumbs: Unknown static segment ${staticSegment}`,
          );
      }
    }

    return res;
  }

  public async joinInstance(params: InstanceParams): Promise<InstanceUserDTO> {
    return await this.db.userInInstance
      .update({
        where: { instanceMembership: { ...expand(params), userId: this.id } },
        data: { joined: true },
        include: { user: true },
      })
      .then(T.toInstanceUserDTO);
  }
}

export class Institution extends DataObject {
  constructor(db: DB) {
    super(db);
  }

  // WARNING bug see group.createSubroup
  public async createGroup(displayName: string): Promise<GroupDTO> {
    return await this.db.allocationGroup
      .create({ data: { id: slugify(displayName), displayName } })
      .then(T.toAllocationGroupDTO);
  }

  public async getAdmins(): Promise<SuperAdminDTO[]> {
    const admins = await this.db.superAdmin.findMany({
      select: { user: true },
    });

    return admins.map(({ user }) => user);
  }

  public async getGroups(): Promise<GroupDTO[]> {
    const groups = await this.db.allocationGroup.findMany();

    return groups.map(T.toAllocationGroupDTO);
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    const instances = await this.db.allocationInstance.findMany();
    return instances.map(T.toAllocationInstanceDTO);
  }

  public async createUser(data: UserDTO): Promise<void> {
    this.db.user.create({ data });
  }

  public async createUsers(users: UserDTO[]): Promise<void> {
    this.db.user.createMany({ data: users, skipDuplicates: true });
  }

  public async userExists(id: string): Promise<boolean> {
    return !!(await this.db.user.findFirst({ where: { id } }));
  }

  public async getUsers(): Promise<UserDTO[]> {
    return await this.db.user.findMany();
  }
}

export class SuperAdmin extends User {}

export class AllocationGroup extends DataObject {
  public params: GroupParams;
  private _institution: Institution | undefined;

  constructor(db: DB, params: GroupParams) {
    super(db);
    this.params = params;
  }

  public async linkAdmin(userId: string): Promise<void> {
    await this.db.groupAdmin.create({
      data: { userId, allocationGroupId: this.params.group },
    });
  }

  public async unlinkAdmin(userId: string): Promise<void> {
    await this.db.groupAdmin.delete({
      where: { groupAdminId: { userId, allocationGroupId: this.params.group } },
    });
  }

  public async createSubGroup(displayName: string): Promise<SubGroupDTO> {
    // WARNING BUG
    // imagine the following:
    // create SG hello
    // rename hello -> goodbye
    // create SG hello
    // This will fail!
    // IT SHOULD NOT!
    // problem: slug & id are the same thing
    // this issue likely persists across all spaces
    // (I haven't checked)
    return await this.db.allocationSubGroup
      .create({
        data: {
          id: slugify(displayName),
          displayName,
          allocationGroupId: this.params.group,
        },
      })
      .then(T.toAllocationSubGroupDTO);
  }

  public async exists(): Promise<boolean> {
    return !!(await this.db.allocationGroup.findFirst({
      where: { id: this.params.group },
    }));
  }

  public async get(): Promise<GroupDTO> {
    return await this.db.allocationGroup
      .findFirstOrThrow({ where: { id: this.params.group } })
      .then(T.toAllocationGroupDTO);
  }

  public async getSubGroups(): Promise<SubGroupDTO[]> {
    const subgroups = await this.db.allocationSubGroup.findMany({
      where: { allocationGroupId: this.params.group },
    });

    return subgroups.map(T.toAllocationSubGroupDTO);
  }

  public async getAdmins(): Promise<UserDTO[]> {
    const admins = await this.db.groupAdmin.findMany({
      where: { allocationGroupId: this.params.group },
      select: { user: true },
    });

    return admins.map(({ user }) => user);
  }

  public async getManagers(): Promise<UserDTO[]> {
    const groupAdmins = await this.getAdmins();
    const superAdmins = await this.institution.getAdmins();

    return uniqueById([...groupAdmins, ...superAdmins]);
  }

  public async isGroupAdmin(userId: string): Promise<boolean> {
    const user = new User(this.db, userId);
    return await user.isGroupAdmin(this.params);
  }

  public async delete(): Promise<GroupDTO> {
    return await this.db.allocationGroup
      .delete({ where: { id: this.params.group } })
      .then(T.toAllocationGroupDTO);
  }

  get institution() {
    if (!this._institution) this._institution = new Institution(this.db);
    return this._institution;
  }
}

export class GroupAdmin extends User {
  allocationGroup: AllocationGroup;

  constructor(db: DB, id: string, groupParams: GroupParams) {
    super(db, id);
    this.allocationGroup = new AllocationGroup(db, groupParams);
  }
}

function toSubgroupId(params: SubGroupParams) {
  return { allocationGroupId: params.group, id: params.subGroup };
}

function subgroupExpand(params: SubGroupParams) {
  return {
    allocationGroupId: params.group,
    allocationSubGroupId: params.subGroup,
  };
}

export class AllocationSubGroup extends DataObject {
  public params: SubGroupParams;
  private _institution: Institution | undefined;
  private _group: AllocationGroup | undefined;

  constructor(db: DB, params: SubGroupParams) {
    super(db);
    this.params = params;
  }

  public async createInstance({
    newInstance: { group, subGroup, ...newInstance },
    flags,
    tags,
  }: {
    newInstance: Omit<InstanceDTO, "instance">;
    flags: (New<FlagDTO> & { unitsOfAssessment: NewUnitOfAssessmentDTO[] })[];
    tags: New<TagDTO>[];
  }) {
    const instanceSlug = slugify(newInstance.displayName);

    const params = { ...this.params, instance: instanceSlug };

    await this.db.$transaction(async (tx) => {
      await tx.allocationInstance.create({
        data: { ...toInstanceId(params), ...newInstance },
      });

      const flagData = await tx.flag.createManyAndReturn({
        data: flags.map((f) => ({
          ...expand(params),
          title: f.title,
          description: f.description,
        })),
        skipDuplicates: true,
      });

      const flagTitleToId = flagData.reduce(
        (acc, val) => ({ ...acc, [val.title]: val.id }),
        {} as Record<string, string>,
      );

      await tx.tag.createMany({
        data: tags.map((t) => ({ ...expand(params), title: t.title })),
      });

      await tx.algorithm.createMany({
        data: builtInAlgorithms.map((alg) => ({ ...expand(params), ...alg })),
      });

      const units = await tx.unitOfAssessment.createManyAndReturn({
        data: flags.flatMap((f) =>
          f.unitsOfAssessment.map((a) => ({
            ...expand(params),
            flagId: flagTitleToId[f.title],
            title: a.title,
            weight: a.weight,
            studentSubmissionDeadline: a.studentSubmissionDeadline,
            markerSubmissionDeadline: a.markerSubmissionDeadline,
            allowedMarkerTypes: a.allowedMarkerTypes,
          })),
        ),
      });

      const unitTitleToId = units.reduce(
        (acc, val) => ({ ...acc, [`${val.flagId}${val.title}`]: val.id }),
        {} as Record<string, string>,
      );

      await tx.assessmentCriterion.createMany({
        data: flags.flatMap((f) =>
          f.unitsOfAssessment.flatMap((u) =>
            u.components.map((c) => ({
              ...expand(params),
              flagId: flagTitleToId[f.title],
              unitOfAssessmentId:
                unitTitleToId[`${flagTitleToId[f.title]}${u.title}`],
              title: c.title,
              description: c.description,
              weight: c.weight,
              layoutIndex: c.layoutIndex,
            })),
          ),
        ),
      });
    });
  }

  public async exists(): Promise<boolean> {
    return !!(await this.db.allocationSubGroup.findFirst({
      where: toSubgroupId(this.params),
    }));
  }

  public async get(): Promise<SubGroupDTO> {
    return await this.db.allocationSubGroup
      .findFirstOrThrow({ where: toSubgroupId(this.params) })
      .then(T.toAllocationSubGroupDTO);
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    return await this.db.allocationInstance
      .findMany({ where: subgroupExpand(this.params) })
      .then((data) => data.map(T.toAllocationInstanceDTO));
  }

  public async isSubGroupAdmin(userId: string): Promise<boolean> {
    return await new User(this.db, userId).isSubGroupAdmin(this.params);
  }

  public async linkAdmin(userId: string): Promise<void> {
    await this.db.subGroupAdmin.create({
      data: { userId, ...subgroupExpand(this.params) },
    });
  }

  public async unlinkAdmin(userId: string): Promise<void> {
    await this.db.subGroupAdmin.delete({
      where: { subGroupAdminId: { userId, ...subgroupExpand(this.params) } },
    });
  }

  public async getAdmins(): Promise<UserDTO[]> {
    const admins = await this.db.subGroupAdmin.findMany({
      where: subgroupExpand(this.params),
      select: { user: true },
    });

    return admins.map(({ user }) => user);
  }

  public async getManagers(): Promise<UserDTO[]> {
    const subGroupAdmins = await this.getAdmins();
    const groupAdmins = await this.group.getAdmins();
    const superAdmins = await this.institution.getAdmins();

    return uniqueById([...subGroupAdmins, ...groupAdmins, ...superAdmins]);
  }

  public async delete(): Promise<SubGroupDTO> {
    return await this.db.allocationSubGroup
      .delete({ where: { subGroupId: toSubgroupId(this.params) } })
      .then(T.toAllocationSubGroupDTO);
  }

  get institution() {
    if (!this._institution) this._institution = new Institution(this.db);
    return this._institution;
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.db, this.params);
    return this._group;
  }
}

export class SubGroupAdmin extends User {
  subGroup: AllocationSubGroup;

  constructor(db: DB, id: string, subGroupParams: SubGroupParams) {
    super(db, id);
    this.subGroup = new AllocationSubGroup(db, subGroupParams);
  }
}

export class AllocationInstance extends DataObject {
  async getUnitOfAssessment(
    unitOfAssessmentId: string,
  ): Promise<UnitOfAssessmentDTO> {
    return await this.db.unitOfAssessment
      .findFirstOrThrow({
        where: { id: unitOfAssessmentId },
        include: { flag: true, assessmentCriteria: true },
      })
      .then(T.toUnitOfAssessmentDTO);
  }
  public async getCriteriaAndScoresForStudentSubmission(
    unitOfAssessmentId: string,
    markerId: string,
    studentId: string,
  ): Promise<AssessmentCriterionWithScoreDTO[]> {
    const data = await this.db.assessmentCriterion.findMany({
      where: { unitOfAssessmentId },
      include: { scores: { where: { markerId, studentId } } },
      orderBy: { layoutIndex: "asc" },
    });

    const d = data.map((c) => ({
      criterion: T.toAssessmentCriterionDTO(c),
      score: c.scores[0] ? T.toScoreDTO(c.scores[0]) : undefined,
    }));

    console.log(d);
    return d;
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
      unitsOfAssessment: f.unitsOfAssessment.map(T.toUnitOfAssessmentDTO),
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

  public async getReaders(): Promise<ReaderDTO[]> {
    const readers = await this.db.readerDetails.findMany({
      where: expand(this.params),
      include: { userInInstance: { include: { user: true } } },
    });

    return readers.map(T.toReaderDTO);
  }

  public async getStudentPreferenceDetails() {
    const students = await this.db.studentDetails.findMany({
      where: expand(this.params),
      include: {
        userInInstance: { include: { user: true } },
        draftPreferences: true,
        submittedPreferences: true,
      },
    });

    return students.map((u) => ({
      institutionId: u.userId,
      fullName: u.userInInstance.user.name,
      email: u.userInInstance.user.email,
      joined: u.userInInstance.joined,
      level: u.studentLevel,
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
        studentFlags: { include: { flag: true } },
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
        PAGES.myMarking,
        ...allocationsTab,
      ],
      [Stage.READER_BIDDING]: [
        PAGES.myProjects,
        ...allocationsTab,
        PAGES.myMarking,
      ],
      [Stage.READER_ALLOCATION]: [
        PAGES.myProjects,
        ...allocationsTab,
        PAGES.myMarking,
      ],
      [Stage.MARK_SUBMISSION]: [
        PAGES.myProjects,
        ...allocationsTab,
        PAGES.myMarking,
      ],
      [Stage.GRADE_PUBLICATION]: [
        PAGES.myProjects,
        ...allocationsTab,
        PAGES.myMarking,
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

  public async edit({
    instance,
    flags,
    tags,
  }: {
    instance: Omit<
      InstanceDTO,
      "stage" | "supervisorAllocationAccess" | "studentAllocationAccess"
    >;
    flags: (New<FlagDTO> & { unitsOfAssessment: NewUnitOfAssessmentDTO[] })[];
    tags: New<TagDTO>[];
  }) {
    const currentInstanceFlags = await this.db.flag.findMany({
      where: expand(this.params),
    });

    const newInstanceFlags = setDiff(
      flags,
      currentInstanceFlags as New<FlagDTO>[],
      byTitle,
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
      await this.db.allocationInstance.update({
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

      await this.db.flag.createMany({
        data: newInstanceFlags.map((f) => ({
          ...expand(this.params),
          title: f.title,
          description: f.description,
        })),
        skipDuplicates: true,
      });

      const flagData = await this.db.flag.findMany({
        where: expand(this.params),
      });

      const flagTitleToId = flagData.reduce(
        (acc, val) => ({ ...acc, [val.title]: val.id }),
        {} as Record<string, string>,
      );

      const units = await tx.unitOfAssessment.createManyAndReturn({
        data: flags.flatMap((f) =>
          f.unitsOfAssessment.map((a) => ({
            ...expand(this.params),
            flagId: flagTitleToId[f.title],
            title: a.title,
            weight: a.weight,
            studentSubmissionDeadline: a.studentSubmissionDeadline,
            markerSubmissionDeadline: a.markerSubmissionDeadline,
            allowedMarkerTypes: a.allowedMarkerTypes,
          })),
        ),
      });

      const unitTitleToId = units.reduce(
        (acc, val) => ({ ...acc, [`${val.flagId}${val.title}`]: val.id }),
        {} as Record<string, string>,
      );

      await tx.assessmentCriterion.createMany({
        data: flags.flatMap((f) =>
          f.unitsOfAssessment.flatMap((u) =>
            u.components.map((c) => ({
              ...expand(this.params),
              flagId: flagTitleToId[f.title],
              unitOfAssessmentId:
                unitTitleToId[`${flagTitleToId[f.title]}${u.title}`],
              title: c.title,
              description: c.description,
              weight: c.weight,
              layoutIndex: c.layoutIndex,
            })),
          ),
        ),
      });

      await this.db.tag.deleteMany({
        where: {
          ...expand(this.params),
          title: { in: staleInstanceTagTitles },
        },
      });

      await this.db.tag.createMany({
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

export class Project extends DataObject {
  public params: ProjectParams;
  private _group: AllocationGroup | undefined;
  private _subgroup: AllocationSubGroup | undefined;
  private _instance: AllocationInstance | undefined;

  constructor(db: DB, params: ProjectParams) {
    super(db);
    this.params = params;
  }

  public async exists() {
    return !!(await this.db.project.findFirst({ where: toPP2(this.params) }));
  }

  public async get(): Promise<ProjectDTO> {
    return await this.db.project
      .findFirstOrThrow({
        where: toPP2(this.params),
        include: {
          flagsOnProject: { include: { flag: true } },
          tagsOnProject: { include: { tag: true } },
        },
      })
      .then(T.toProjectDTO);
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

  get instance() {
    if (!this._instance)
      this._instance = new AllocationInstance(this.db, this.params);
    return this._instance;
  }

  public async getFlags(): Promise<FlagDTO[]> {
    const data = await this.db.project.findFirstOrThrow({
      where: toPP2(this.params),
      include: { flagsOnProject: { include: { flag: true } } },
    });

    return data.flagsOnProject.map((f) => T.toFlagDTO(f.flag));
  }

  public async delete(): Promise<void> {
    await this.db.project.delete({ where: toPP2(this.params) });
  }
}

export class Marker extends User {
  instance: AllocationInstance;

  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id);
    this.instance = new AllocationInstance(db, params);
  }

  public async getProjectsWithSubmissions(): Promise<
    {
      project: ProjectDTO;
      student: StudentDTO;
      markerType: MarkerType;
      unitsOfAssessment: UnitOfAssessmentDTO[];
    }[]
  > {
    type Ret = {
      project: ProjectDTO;
      student: StudentDTO;
      markerType: MarkerType;
      unitsOfAssessment: UnitOfAssessmentDTO[];
    };

    let assignedProjects: {
      project: ProjectDTO;
      student: StudentDTO;
      markerType: MarkerType;
      unitsOfAssessment: UnitOfAssessmentDTO[];
    }[] = [];

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

      assignedProjects.push(
        ...data.flatMap((a) =>
          a.student.studentFlags.flatMap((f) => ({
            project: T.toProjectDTO(a.project),
            student: T.toStudentDTO(a.student),
            markerType: MarkerType.SUPERVISOR,
            unitsOfAssessment: f.flag.unitsOfAssessment.map((x) =>
              T.toUnitOfAssessmentDTO(x),
            ),
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

export class Supervisor extends Marker {
  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id, params);
  }

  public async toDTO(): Promise<SupervisorDTO> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: { userInInstance: { include: { user: true } } },
      })
      .then(T.toSupervisorDTO);
  }

  public async get(): Promise<UserDTO> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: { userInInstance: { include: { user: true } } },
      })
      .then((x) => x.userInInstance.user);
  }

  public async getSupervisionAllocations(): Promise<
    { project: ProjectDTO; student: StudentDTO; rank: number }[]
  > {
    return await this.db.studentProjectAllocation
      .findMany({
        where: {
          project: { supervisorId: this.id },
          ...expand(this.instance.params),
        },
        include: {
          project: {
            include: {
              tagsOnProject: { include: { tag: true } },
              flagsOnProject: { include: { flag: true } },
            },
          },
          student: {
            include: {
              studentFlags: { include: { flag: true } },
              userInInstance: { include: { user: true } },
            },
          },
        },
      })
      .then((data) =>
        data.map(({ project, student, studentRanking }) => ({
          project: T.toProjectDTO(project),
          student: T.toStudentDTO(student),
          rank: studentRanking,
        })),
      );
  }

  public async getCapacityDetails(): Promise<{
    projectTarget: number;
    projectUpperQuota: number;
  }> {
    return await this.db.supervisorDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
      })
      .then((x) => ({
        projectTarget: x.projectAllocationTarget,
        projectUpperQuota: x.projectAllocationUpperBound,
      }));
  }

  public async getProjects(): Promise<
    { project: ProjectDTO; allocatedStudents: StudentDTO[] }[]
  > {
    const projectData = await this.db.project.findMany({
      where: { supervisorId: this.id, ...expand(this.instance.params) },
      include: {
        tagsOnProject: { include: { tag: true } },
        flagsOnProject: { include: { flag: true } },
        studentAllocations: {
          include: {
            student: {
              include: {
                studentFlags: { include: { flag: true } },
                userInInstance: { include: { user: true } },
              },
            },
          },
        },
      },
    });

    return projectData.map((x) => ({
      project: T.toProjectDTO(x),
      allocatedStudents: x.studentAllocations.map((s) =>
        T.toStudentDTO(s.student),
      ),
    }));
  }

  public async getProjectsWithDetails() {
    const { projects: projectData } =
      await this.db.supervisorDetails.findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: {
          projects: {
            include: {
              studentAllocations: {
                include: {
                  student: {
                    include: { userInInstance: { include: { user: true } } },
                  },
                },
              },
              tagsOnProject: { include: { tag: true } },
              flagsOnProject: { include: { flag: true } },
            },
          },
        },
      });

    return projectData.map((data) => ({
      project: T.toProjectDTO(data),
      // TODO remove below
      ...T.toProjectDTO(data),
      allocatedStudents: data.studentAllocations.map((u) => ({
        level: u.student.studentLevel,
        ...u.student.userInInstance.user,
      })),
      flags: data.flagsOnProject.map((f) => T.toFlagDTO(f.flag)),
      tags: data.tagsOnProject.map((t) => T.toTagDTO(t.tag)),
    }));
  }

  // Probably a bad access path
  public async countAllocationsInParent(parentInstanceId: string) {
    const parentInstanceParams = {
      ...this.instance.params,
      instance: parentInstanceId,
    };

    return await new Supervisor(this.db, this.id, parentInstanceParams)
      .getSupervisionAllocations()
      .then((allocations) => allocations.length);
  }

  public async countAllocations() {
    return await this.getSupervisionAllocations().then(
      (allocations) => allocations.length,
    );
  }

  public async setCapacityDetails({
    projectTarget,
    projectUpperQuota,
  }: {
    projectTarget: number;
    projectUpperQuota: number;
  }): Promise<{ projectTarget: number; projectUpperQuota: number }> {
    await this.db.supervisorDetails.update({
      where: {
        supervisorDetailsId: {
          userId: this.id,
          ...expand(this.instance.params),
        },
      },
      data: {
        projectAllocationTarget: projectTarget,
        projectAllocationUpperBound: projectUpperQuota,
      },
    });
    return { projectTarget, projectUpperQuota };
  }
}

export class Reader extends Marker {
  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id, params);
  }

  public async getAllocations(): Promise<
    { project: ProjectDTO; student: StudentDTO }[]
  > {
    const data = await this.db.readerProjectAllocation.findMany({
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

    return data.map((a) => ({
      project: T.toProjectDTO(a.project),
      student: T.toStudentDTO(a.student),
    }));
  }
}

export class Student extends User {
  instance: AllocationInstance;

  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id);
    this.instance = new AllocationInstance(db, params);
  }

  public async get(): Promise<StudentDTO> {
    return await this.db.studentDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: {
          studentFlags: { include: { flag: true } },
          userInInstance: { include: { user: true } },
        },
      })
      .then(T.toStudentDTO);
  }

  public async hasSelfDefinedProject(): Promise<boolean> {
    return !!(await this.db.project.findFirst({
      where: {
        preAllocatedStudentId: this.id,
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
    supervisor: SupervisorDTO;
    studentRanking: number;
  }> {
    return await this.db.studentProjectAllocation
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
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
        },
      })
      .then((x) => ({
        project: T.toProjectDTO(x.project),
        supervisor: T.toSupervisorDTO(x.project.supervisor),
        studentRanking: x.studentRanking,
      }));
  }

  public async getLatestSubmissionDateTime(): Promise<Date | undefined> {
    const { latestSubmission } = await this.get();

    return latestSubmission;
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

  public async getAllDraftPreferences(): Promise<
    {
      project: ProjectDTO;
      score: number;
      type: PreferenceType;
      supervisor: SupervisorDTO;
    }[]
  > {
    const preferenceData = await this.db.studentDraftPreference.findMany({
      where: { userId: this.id, ...expand(this.instance.params) },
      select: {
        type: true,
        score: true,
        project: {
          include: {
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
          },
        },
      },
      orderBy: { score: "asc" },
    });

    return preferenceData
      .sort(sortPreferenceType)
      .map((x) => ({
        project: T.toProjectDTO(x.project),
        supervisor: T.toSupervisorDTO(x.project.supervisor),
        score: x.score,
        type: x.type,
      }));
  }

  public async getSubmittedPreferences(): Promise<
    { project: ProjectDTO; supervisor: SupervisorDTO; rank: number }[]
  > {
    return await this.db.studentDetails
      .findFirstOrThrow({
        where: { userId: this.id, ...expand(this.instance.params) },
        include: {
          submittedPreferences: {
            include: {
              project: {
                include: {
                  flagsOnProject: { include: { flag: true } },
                  tagsOnProject: { include: { tag: true } },
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
        data.submittedPreferences.map((x) => ({
          project: T.toProjectDTO(x.project),
          supervisor: T.toSupervisorDTO(x.project.supervisor),
          rank: x.rank,
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

  public async setStudentLevel(level: number): Promise<StudentDTO> {
    return await this.db.studentDetails
      .update({
        where: {
          studentDetailsId: {
            userId: this.id,
            ...expand(this.instance.params),
          },
        },
        data: { studentLevel: level },
        include: {
          studentFlags: { include: { flag: true } },
          userInInstance: { include: { user: true } },
        },
      })
      .then(T.toStudentDTO);
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
        include: {
          project: {
            include: {
              flagsOnProject: { include: { flag: true } },
              tagsOnProject: { include: { tag: true } },
              supervisor: {
                include: { userInInstance: { include: { user: true } } },
              },
            },
          },
        },
      })
      .then((data) => ({
        project: T.toProjectDTO(data.project),
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

type allocationDataDTO = {
  student: StudentDTO;
  supervisor: SupervisorDTO;
  project: ProjectDTO;
  ranking: number;
};

export class StudentProjectAllocationData extends DataObject {
  private allocationData: allocationDataDTO[];

  constructor(db: DB, data: allocationDataDTO[]) {
    super(db);
    this.db = db;
    this.allocationData = data;
  }

  static async fromDB(db: DB, params: InstanceParams) {
    const data = await db.studentProjectAllocation.findMany({
      where: expand(params),
      include: {
        student: {
          include: {
            userInInstance: { include: { user: true } },
            studentFlags: { include: { flag: true } },
          },
        },
        project: {
          include: {
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
          },
        },
      },
    });

    const formatData = data.map((x) => ({
      student: T.toStudentDTO(x.student),
      supervisor: T.toSupervisorDTO(x.project.supervisor),
      project: T.toProjectDTO(x.project),
      ranking: x.studentRanking,
    }));

    return new StudentProjectAllocationData(db, formatData);
  }

  public toRecord() {
    return this.allocationData.reduce(
      (acc, { project, student }) => ({
        ...acc,
        [project.id]: [...(acc[project.id] ?? []), student.id],
      }),
      {} as Record<string, string[]>,
    );
  }

  public toStudentView() {
    return this.allocationData
      .map(({ ranking, student, project, supervisor }) => ({
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          ranking,
        },
        project: { id: project.id, title: project.title },
        supervisor: { id: supervisor.id, name: supervisor.name },
      }))
      .sort((a, b) => a.student.id.localeCompare(b.student.id));
  }

  public toProjectView() {
    return this.allocationData
      .map((allocation) => ({
        project: {
          id: allocation.project.id,
          title: allocation.project.title,
          capacityLowerBound: allocation.project.capacityLowerBound,
          capacityUpperBound: allocation.project.capacityUpperBound,
        },
        supervisor: {
          id: allocation.supervisor.id,
          name: allocation.supervisor.name,
        },
        student: {
          id: allocation.student.id,
          name: allocation.student.name,
          ranking: allocation.ranking,
        },
      }))
      .sort((a, b) => a.project.id.localeCompare(b.project.id));
  }

  public toSupervisorView() {
    return this.allocationData
      .map((allocation) => ({
        project: { id: allocation.project.id, title: allocation.project.title },
        supervisor: {
          id: allocation.supervisor.id,
          name: allocation.supervisor.name!,
          email: allocation.supervisor.email!,
          allocationLowerBound: allocation.supervisor.allocationLowerBound,
          allocationTarget: allocation.supervisor.allocationTarget,
          allocationUpperBound: allocation.supervisor.allocationUpperBound,
        },
        student: {
          id: allocation.student.id,
          name: allocation.student.name,
          ranking: allocation.ranking,
        },
      }))
      .sort((a, b) => a.supervisor.id.localeCompare(b.supervisor.id));
  }

  public getViews() {
    return {
      byStudent: this.toStudentView(),
      byProject: this.toProjectView(),
      bySupervisor: this.toSupervisorView(),
    };
  }

  public toExportData() {
    return this.allocationData
      .map(({ project: p, student, supervisor, ...e }) => ({
        project: {
          id: p.id,
          title: p.title,
          description: p.description,
          supervisor: supervisor,
          specialTechnicalRequirements: p.specialTechnicalRequirements ?? "",
        },
        student: {
          id: student.id,
          name: student.name,
          matric: guidToMatric(student.id),
          level: student.level,
          email: student.email,
          ranking: e.ranking,
        },
        supervisor: supervisor,
      }))
      .sort((a, b) => a.student.id.localeCompare(b.student.id));
  }
}

export class MatchingAlgorithm extends DataObject {
  public params: AlgorithmInstanceParams;

  private _config: AlgorithmDTO | undefined;
  private _instance: InstanceDTO | undefined;
  private _results: MatchingResultDTO | undefined;

  constructor(db: DB, params: AlgorithmInstanceParams) {
    super(db);
    this.params = params;
  }

  public async get(): Promise<AlgorithmDTO> {
    if (!this._config) {
      this._config = await this.db.algorithm
        .findFirstOrThrow({ where: { id: this.params.algConfigId } })
        .then(Transformers.toAlgorithmDTO);
    }
    return this._config!;
  }

  public async getInstance(): Promise<InstanceDTO> {
    if (!this._instance) {
      this._instance = await this.db.allocationInstance
        .findFirstOrThrow({ where: expand(this.params) })
        .then(Transformers.toAllocationInstanceDTO);
    }
    return this._instance!;
  }

  public async run(matchingData: MatchingDataDTO): Promise<AlgorithmRunResult> {
    const alg = await this.get();
    const res = await executeMatchingAlgorithm(alg, matchingData);

    if (res.status !== AlgorithmRunResult.OK) return res.status;

    const { data } = res;

    // TODO: fix discriminated union
    if (!data) throw new Error("No data returned from algorithm");

    const matchingResult = {
      profile: data.profile,
      degree: data.degree,
      size: data.size,
      weight: data.weight,
      cost: data.cost,
      costSq: data.costSq,
      maxLecAbsDiff: data.maxLecAbsDiff,
      sumLecAbsDiff: data.sumLecAbsDiff,
      ranks: data.ranks,
    };

    const matchingPairs = data.matching
      .filter((x) => x.project_id !== "0")
      .map((x) => ({
        ...expand(this.params),
        userId: x.student_id,
        projectId: x.project_id,
        studentRanking: x.preference_rank,
      }));

    await this.db.$transaction([
      this.db.matchingPair.deleteMany({
        where: { matchingResult: { algorithm: toAlgID(this.params) } },
      }),

      this.db.matchingResult.upsert({
        where: toAlgID(this.params),
        update: matchingResult,
        create: {
          ...toAlgID(this.params),
          ...matchingResult,
          matching: {
            createMany: { data: matchingPairs, skipDuplicates: true },
          },
        },
      }),
    ]);

    this._results = { ...matchingResult, matching: matchingPairs };

    return AlgorithmRunResult.OK;
  }

  /**
   *
   * @throws if the function is called before the results are computed
   */
  public async getResults(): Promise<MatchingResultDTO> {
    if (!this._results) {
      this._results = await this.db.matchingResult
        .findFirstOrThrow({
          where: {
            algorithmId: this.params.algConfigId,
            ...expand(this.params),
          },
          include: { matching: true },
        })
        .then((x) => ({
          profile: x.profile,
          degree: x.degree,
          size: x.size,
          weight: x.weight,
          cost: x.cost,
          costSq: x.costSq,
          maxLecAbsDiff: x.maxLecAbsDiff,
          sumLecAbsDiff: x.sumLecAbsDiff,
          ranks: x.ranks,
          matching: x.matching,
        }));
    }
    return this._results!;
  }

  public async getMatching(): Promise<MatchingResultDTO> {
    const res = await this.db.matchingResult.findFirst({
      where: { algorithmId: this.params.algConfigId, ...expand(this.params) },
      include: { matching: true },
    });

    return !res ? blankResult : res;
  }

  public async delete(): Promise<void> {
    await this.db.algorithm.delete({ where: { id: this.params.algConfigId } });
  }
}
