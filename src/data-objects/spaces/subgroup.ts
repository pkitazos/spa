import { GroupParams, SubGroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { AllocationGroup } from "./group";

import { DAL } from "@/data-access";

export class AllocationSubGroup extends DataObject {
  public params: SubGroupParams;
  private _group: AllocationGroup | undefined;

  constructor(dal: DAL, params: SubGroupParams) {
    super(dal);
    this.params = params;
  }

  static async create(dal: DAL, params: GroupParams, name: string) {
    return await dal.subGroup.create(params.group, name);
  }

  public async exists() {
    return await this.dal.subGroup.exists(this.params);
  }

  public async get() {
    return await this.dal.subGroup.get(this.params);
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.dal, this.params);
    return this._group;
  }

  public async delete() {
    await this.dal.subGroup.delete(this.params);
  }
}
