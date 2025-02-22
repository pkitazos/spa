import { ValidatedInstanceDetails } from "@/lib/validations/instance-form";
import { SubGroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { AllocationGroup } from "./group";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";
import { UserDTO } from "@/dto";

export class AllocationSubGroup extends DataObject {
  public params: SubGroupParams;
  private _group: AllocationGroup | undefined;

  constructor(dal: DAL, db: DB, params: SubGroupParams) {
    super(dal, db);
    this.params = params;
  }

  public async createInstance(newInstance: ValidatedInstanceDetails) {
    return this.dal.instance.create(this.params, newInstance);
  }

  public async exists() {
    return await this.dal.subGroup.exists(this.params);
  }

  public async get() {
    return await this.dal.subGroup.get(this.params);
  }

  get group() {
    if (!this._group)
      this._group = new AllocationGroup(this.dal, this.db, this.params);
    return this._group;
  }

  public async getInstances() {
    return await this.dal.subGroup.getInstances(this.params);
  }

  public async getAdmins(): Promise<UserDTO[]> {
    return await this.dal.subGroup.getAdmins(this.params);
  }

  public async getManagers(): Promise<UserDTO[]> {
    const subGroupAdmins = await this.getAdmins();
    const groupAdmins = await this.group.getAdmins();
    const superAdmins = await this.dal.superAdmin.getAll();
    // TODO distinct (nubs)
    return [...subGroupAdmins, ...groupAdmins, ...superAdmins];
  }

  public async delete() {
    await this.dal.subGroup.delete(this.params);
  }
}
