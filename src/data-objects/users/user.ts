import {
  GroupParams,
  InstanceParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { UserDTO } from "@/server/routers/user/dto";

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

  public isSuperAdmin(): boolean {
    return this.dal.user.isSuperAdmin(this.id);
  }

  public toSuperAdmin() {
    if (!this.isSuperAdmin()) throw new Error("unauthorised");
    return new SuperAdmin(this.dal, this.id);
  }

  public isGroupAdmin(groupParams: GroupParams): boolean {
    return this.dal.user.isGroupAdmin(this.id, groupParams);
  }

  public toGroupAdmin(groupParams: GroupParams) {
    if (!this.isGroupAdmin(groupParams)) throw new Error("unauthorised");
    return new GroupAdmin(this.dal, this.id, groupParams);
  }

  public isSubGroupAdmin(subGroupParams: SubGroupParams): boolean {
    return this.dal.user.isSubGroupAdmin(this.id, subGroupParams);
  }

  public toSubGroupAdmin(subGroupParams: SubGroupParams) {
    if (!this.isSubGroupAdmin(subGroupParams)) throw new Error("unauthorised");
    return new SubGroupAdmin(this.dal, this.id, subGroupParams);
  }

  public isInstanceStudent(instanceParams: InstanceParams) {
    return this.dal.user.isInstanceStudent(this.id, instanceParams);
  }

  public toInstanceStudent(instanceParams: InstanceParams) {
    if (!this.isInstanceStudent(instanceParams))
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

  public isProjectSupervisor(projectParams: ProjectParams) {
    return this.dal.user.isProjectSupervisor(this.id, projectParams);
  }

  public toProjectSupervisor(projectParams: ProjectParams) {
    if (!this.isProjectSupervisor(projectParams))
      throw new Error("unauthorised");

    return new ProjectSupervisor(this.dal, this.id, projectParams);
  }

  public isProjectReader(projectParams: ProjectParams) {
    return this.dal.user.isProjectReader(this.id, projectParams);
  }

  public toProjectReader(projectParams: ProjectParams) {
    if (!this.isProjectReader(projectParams)) throw new Error("unauthorised");

    return new ProjectReader(this.dal, this.id, projectParams);
  }

  public async toDTO(): Promise<UserDTO> {
    if (!this._data) {
      this._data = await this.dal.user.getDetails(this.id);
    }
    return this._data;
  }

  public async joinInstance(instanceParams: InstanceParams) {
    await this.dal.user.joinInstance(this.id, instanceParams);
  }
}
