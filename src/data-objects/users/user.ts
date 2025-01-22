import {
  GroupParams,
  InstanceParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { GroupAdmin } from "./group-admin";
import { InstanceReader } from "./instance-reader";
import { InstanceStudent } from "./instance-student";
import { InstanceSupervisor } from "./instance-supervisor";
import { ProjectReader } from "./project-reader";
import { ProjectSupervisor } from "./project-supervisor";
import { SubGroupAdmin } from "./subgroup-admin";
import { SuperAdmin } from "./super-admin";

import { DAL } from "@/data-access";
import { Role, SystemRole } from "@/db";
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
      (await this.isGroupAdmin({ group: params.group })) ||
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
      throw new Error("unauthorised");

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
      (await this.isInstanceReader(params)) ||
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
