import { relativeComplement } from "@/lib/utils/general/set-difference";
import { ValidatedSegments } from "@/lib/validations/breadcrumbs";
import {
  GroupParams,
  InstanceParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { AllocationInstance } from "../spaces/instance";
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
import { Role, SystemRole } from "@/db/types";
import { UserDTO } from "@/dto";

export class User extends DataObject {
  id: string;
  private _data: UserDTO | undefined;

  constructor(dal: DAL, id: string) {
    super(dal);
    this.id = id;
  }

  static fromDTO(dal: DAL, data: UserDTO) {
    const user = new User(dal, data.id);
    user._data = data;
  }

  public toUser() {
    return new User(this.dal, this.id);
  }

  public async isSuperAdmin(): Promise<boolean> {
    return await this.dal.user.isSuperAdmin(this.id);
  }

  public async toSuperAdmin() {
    if (!(await this.isSuperAdmin())) throw new Error("unauthorised");
    return new SuperAdmin(this.dal, this.id);
  }

  public async isGroupAdmin(groupParams: GroupParams): Promise<boolean> {
    return await this.dal.user.isGroupAdmin(this.id, groupParams);
  }

  public async isGroupAdminOrBetter(params: GroupParams): Promise<boolean> {
    return (await this.isSuperAdmin()) || (await this.isGroupAdmin(params));
  }

  public async toGroupAdmin(groupParams: GroupParams) {
    if (!(await this.isGroupAdmin(groupParams)))
      throw new Error("unauthorised");
    return new GroupAdmin(this.dal, this.id, groupParams);
  }

  public async isSubGroupAdmin(
    subGroupParams: SubGroupParams,
  ): Promise<boolean> {
    return await this.dal.user.isSubGroupAdmin(this.id, subGroupParams);
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
    return new SubGroupAdmin(this.dal, this.id, subGroupParams);
  }

  public async isInstanceStudent(
    instanceParams: InstanceParams,
  ): Promise<boolean> {
    return await this.dal.user.isInstanceStudent(this.id, instanceParams);
  }

  public async toInstanceStudent(instanceParams: InstanceParams) {
    if (!(await this.isInstanceStudent(instanceParams)))
      throw new Error("unauthorised");

    return new InstanceStudent(this.dal, this.id, instanceParams);
  }

  public isInstanceSupervisor(instanceParams: InstanceParams) {
    return this.dal.user.isInstanceSupervisor(this.id, instanceParams);
  }

  public toInstanceSupervisor(instanceParams: InstanceParams) {
    if (!this.isInstanceSupervisor(instanceParams))
      throw new Error("User is not a supervisor in this instance");

    return new InstanceSupervisor(this.dal, this.id, instanceParams);
  }

  public isInstanceReader(instanceParams: InstanceParams) {
    return this.dal.user.isInstanceReader(this.id, instanceParams);
  }

  public toInstanceReader(instanceParams: InstanceParams) {
    if (!this.isInstanceReader(instanceParams)) throw new Error("unauthorised");

    return new InstanceReader(this.dal, this.id, instanceParams);
  }

  public async isInstanceMember(params: InstanceParams) {
    // TODO @pkitazos
    // might need some SBAC here
    return (
      (await this.isSubGroupAdmin(params)) ||
      (await this.isInstanceSupervisor(params)) ||
      (await this.isInstanceStudent(params)) ||
      (await this.isInstanceReader(params))
    );
  }

  public isProjectSupervisor(projectParams: ProjectParams) {
    // ? Should this first check that user is in-fact a supervisor in this instance or should it assume that the user is a supervisor in the instance?
    // for now, I'm assuming that the user is a supervisor in the instance
    // irrelevant; we just need to know if they supervise this project

    return this.dal.user.isProjectSupervisor(this.id, projectParams);
  }

  public toProjectSupervisor(projectParams: ProjectParams) {
    if (!this.isProjectSupervisor(projectParams))
      throw new Error("unauthorised");

    return new ProjectSupervisor(this.dal, this.id, projectParams);
  }

  public isProjectReader(projectParams: ProjectParams) {
    // ? Should this first check that user is in-fact a reader in this instance or should it assume that the user is a reader in the instance?
    // for now, I'm assuming that the user is a reader in the instance
    return this.dal.user.isProjectReader(this.id, projectParams);
  }

  public toProjectReader(projectParams: ProjectParams) {
    if (!this.isProjectReader(projectParams)) throw new Error("unauthorised");

    return new ProjectReader(this.dal, this.id, projectParams);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async canAccessProject(_projectParams: ProjectParams) {
    // TODO @pkitazos spec for when you can access a project would be great
    return true;
  }

  public async getRolesInInstance(instanceParams: InstanceParams) {
    const roles = new Set<SystemRole>();

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

  public async getManagedGroups() {
    return await this.dal.user.getManagedGroups(this.id);
  }

  public async getManagedSubGroups() {
    return await this.dal.user.getManagedSubGroups(this.id);
  }

  public async getInstances() {
    if (await this.isSuperAdmin()) {
      const instances = await Institution.getAllInstances(this.dal);
      return AllocationInstance.toQualifiedPaths(this.dal, instances);
    }

    const groups = await this.dal.groupAdmin.getAllGroups(this.id);
    const groupAdminInstances = await this.dal.instance.getForGroups(groups);

    const subGroups = await this.dal.subGroupAdmin.getAllSubgroups(this.id);

    const uniqueSubGroups = relativeComplement(
      subGroups,
      groups,
      (a, b) => a.group == b.group,
    );

    const subGroupAdminInstances =
      await this.dal.instance.getForGroups(uniqueSubGroups);

    const privilegedInstances = [
      ...groupAdminInstances,
      ...subGroupAdminInstances,
    ];

    const unprivilegedInstances = await this.dal.user.getAllInstances(this.id);

    const uniqueUnprivileged = relativeComplement(
      unprivilegedInstances,
      privilegedInstances,
      AllocationInstance.eq,
    );

    const allInstances = [...privilegedInstances, ...uniqueUnprivileged];
    return await AllocationInstance.toQualifiedPaths(this.dal, allInstances);
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
    if (subGroup) {
      res.push({
        segment: subGroup,
        access: await this.isSubGroupAdminOrBetter({ group, subGroup }),
      });
    }
    if (instance) {
      res.push({
        segment: instance,
        access: await this.isInstanceMember({ group, subGroup, instance }),
      });
    }

    // TODO: this doesn't yet handle users access to the /supervisors/[id] and /students/[id] routes (possibly going to be a new /readers/[id] route)
    // users who don't have access to those pages should still see the breadcrumbs with the correct permissions to be able to navigate back to their allowed pages

    // @pkitazos here's is a skeleton implementation - just needs you to implement the rules for when access is possible
    if (staticSegment) {
      res.push({
        segment: staticSegment,
        access: true,
      });
    }

    if (id) {
      switch (staticSegment) {
        case "projects":
          res.push({
            segment: id,
            access: true,
          });
          break;

        case "students":
          res.push({
            segment: id,
            access: true,
          });
          break;

        case "supervisors":
          res.push({
            segment: id,
            access: true,
          });
          break;

        case "readers":
          res.push({
            segment: id,
            access: true,
          });
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
      this._data = await this.dal.user.get(this.id);
    }
    return this._data;
  }

  public async joinInstance(instanceParams: InstanceParams) {
    await this.dal.user.joinInstance(this.id, instanceParams);
  }
}
