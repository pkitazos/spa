import { expand } from "@/lib/utils/general/instance-params";
import { ValidatedSegments } from "@/lib/validations/breadcrumbs";
import {
  GroupParams,
  InstanceParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { Institution } from "../spaces/institution";

import { GroupAdmin } from "./group-admin";
import { InstanceReader } from "./instance-reader";
import { InstanceStudent } from "./instance-student";
import { InstanceSupervisor } from "./instance-supervisor";
import { ProjectReader } from "./project-reader";
import { ProjectSupervisor } from "./project-supervisor";
import { SubGroupAdmin } from "./subgroup-admin";
import { SuperAdmin } from "./super-admin";

import { DAL } from "@/data-access";
import { Transformers as T } from "@/db/transformers";
import { DB, Role } from "@/db/types";
import { InstanceUserDTO, UserDTO } from "@/dto";
import { InstanceDTO, InstanceUserDTO, UserDTO } from "@/dto";
export class User extends DataObject {
  id: string;
  private _data: UserDTO | undefined;

  constructor(db: DB, id: string) {
    super(db);
    this.id = id;
  }

  static fromDTO(db: DB, data: UserDTO) {
    const user = new User(db, data.id);
    user._data = data;
  }

  public toUser() {
    return new User(this.db, this.id);
  }

  public async isSuperAdmin(): Promise<boolean> {
    return !!(await this.db.superAdmin.findFirst({
      where: { userId: this.id },
    }));
  }

  public async toSuperAdmin() {
    if (!(await this.isSuperAdmin())) throw new Error("unauthorised");
    return new SuperAdmin(this.db, this.id);
  }

  public async isGroupAdmin(groupParams: GroupParams): Promise<boolean> {
    return !!(await this.db.groupAdmin.findFirst({
      where: { userId: this.id, allocationGroupId: groupParams.group },
    }));
  }

  public async isGroupAdminOrBetter(params: GroupParams): Promise<boolean> {
    return (await this.isSuperAdmin()) || (await this.isGroupAdmin(params));
  }

  public async toGroupAdmin(groupParams: GroupParams) {
    if (!(await this.isGroupAdmin(groupParams)))
      throw new Error("unauthorised");
    return new GroupAdmin(this.db, this.id, groupParams);
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

  public async isSubGroupAdminOrBetter(
    params: SubGroupParams,
  ): Promise<boolean> {
    return (
      (await this.isGroupAdminOrBetter({ group: params.group })) ||
      (await this.isSubGroupAdmin(params))
    );
  }

  public async toSubGroupAdmin(subGroupParams: SubGroupParams) {
    if (!(await this.isSubGroupAdmin(subGroupParams)))
      throw new Error("unauthorised");
    return new SubGroupAdmin(this.db, this.id, subGroupParams);
  }

  public async isInstanceStudent(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.studentDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public async toInstanceStudent(instanceParams: InstanceParams) {
    if (!(await this.isInstanceStudent(instanceParams)))
      throw new Error("unauthorised");

    return new InstanceStudent(this.db, this.id, instanceParams);
  }

  public async hasSelfDefinedProject(instanceParams: InstanceParams) {
    if (!(await this.isInstanceStudent(instanceParams))) return false;

    return await this.toInstanceStudent(instanceParams).then((s) =>
      s.hasSelfDefinedProject(),
    );
  }

  public async isInstanceSupervisor(params: InstanceParams) {
    return !!(await this.db.supervisorDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public toInstanceSupervisor(instanceParams: InstanceParams) {
    if (!this.isInstanceSupervisor(instanceParams))
      throw new Error("User is not a supervisor in this instance");

    return new InstanceSupervisor(this.db, this.id, instanceParams);
  }

  public async isInstanceReader(params: InstanceParams) {
    return !!(await this.db.readerDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public toInstanceReader(instanceParams: InstanceParams) {
    if (!this.isInstanceReader(instanceParams)) throw new Error("unauthorised");

    return new InstanceReader(this.db, this.id, instanceParams);
  }

  public async isInstanceMember(params: InstanceParams) {
    return (
      (await this.isSubGroupAdminOrBetter(params)) ||
      (await this.isInstanceSupervisor(params)) ||
      (await this.isInstanceStudent(params)) ||
      (await this.isInstanceReader(params))
    );
  }

  public async isProjectSupervisor({ projectId, ...params }: ProjectParams) {
    return !!(await this.db.project.findFirst({
      where: { id: projectId, ...expand(params), supervisorId: this.id },
    }));
  }

  public toProjectSupervisor(projectParams: ProjectParams) {
    if (!this.isProjectSupervisor(projectParams))
      throw new Error("unauthorised");

    return new ProjectSupervisor(this.db, this.id, projectParams);
  }

  public async isProjectReader({ projectId, ...params }: ProjectParams) {
    return !!(await this.db.readerProjectAllocation.findFirst({
      where: { projectId, ...expand(params), readerId: this.id },
    }));
  }

  public async toProjectReader(projectParams: ProjectParams) {
    if (!(await this.isProjectReader(projectParams))) {
      throw new Error("unauthorised");
    }

    return new ProjectReader(this.db, this.id, projectParams);
  }

  public async getRolesInInstance(instanceParams: InstanceParams) {
    const roles = new Set<Role>();

    if (await this.isSubGroupAdminOrBetter(instanceParams)) {
      roles.add(Role.ADMIN);
    }
    if (await this.isInstanceStudent(instanceParams)) {
      roles.add(Role.STUDENT);
    }
    if (await this.isInstanceReader(instanceParams)) {
      roles.add(Role.READER);
    }
    if (await this.isInstanceSupervisor(instanceParams)) {
      roles.add(Role.SUPERVISOR);
    }

    return roles;
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

  public async getInstances() {
    if (await this.isSuperAdmin()) {
      const instances = await new Institution(this.db).getInstances();
      return AllocationInstance.toQualifiedPaths(this.db, instances);
    }

    const dal = new DAL(this.db);

    this.getManagedGroups();

    const groups = await dal.groupAdmin.getAllGroups(this.id);
    const groupAdminInstances = await dal.instance.getForGroups(groups);

    const subGroups = await dal.subGroupAdmin.getAllSubgroups(this.id);

    const uniqueSubGroups = relativeComplement(
      subGroups,
      groups,
      (a, b) => a.group == b.group,
    );

    const subGroupAdminInstances =
      await dal.instance.getForGroups(uniqueSubGroups);

    const privilegedInstances = [
      ...groupAdminInstances,
      ...subGroupAdminInstances,
    ];

    const unprivilegedInstances = await dal.user.getAllInstances(this.id);

    const uniqueUnprivileged = relativeComplement(
      unprivilegedInstances,
      privilegedInstances,
      AllocationInstance.eq,
    );

    const allInstances = [...privilegedInstances, ...uniqueUnprivileged];
    return await AllocationInstance.toQualifiedPaths(this.db, allInstances);
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
        access: await this.isInstanceMember({ group, subGroup, instance }),
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

  public async toDTO(): Promise<UserDTO> {
    if (!this._data) {
      this._data = await this.db.user.findFirstOrThrow({
        where: { id: this.id },
      });
    }
    return this._data;
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

  public async isInstanceStaff(params: InstanceParams): Promise<boolean> {
    return (
      (await this.isSubGroupAdminOrBetter(params)) ||
      (await this.isInstanceSupervisor(params)) ||
      (await this.isInstanceReader(params))
    );
  }
}
