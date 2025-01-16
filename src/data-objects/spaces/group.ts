import { GroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { DAL } from "@/data-access";
import { GroupDTO, SubGroupDTO } from "@/dto";

export class AllocationGroup extends DataObject {
  public params: GroupParams;

  constructor(dal: DAL, params: GroupParams) {
    super(dal);
    this.params = params;
  }

  static async create(dal: DAL, name: string) {
    return await dal.group.create(name);
  }

  async exists(): Promise<boolean> {
    return await this.dal.group.exists(this.params);
  }

  async get(): Promise<GroupDTO> {
    return await this.dal.group.get(this.params);
  }

  async getSubGroups(): Promise<SubGroupDTO[]> {
    return await this.dal.subGroup.getAllForGroup(this.params);
  }

  async delete() {
    return await this.dal.group.delete(this.params);
  }
}
