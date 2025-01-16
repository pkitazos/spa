import { GroupParams } from "@/lib/validations/params";

import { GroupDTO, SubGroupDTO } from "@/server/routers/user/dto";

import { DataObject } from "../data-object";

import { DAL } from "@/data-access";

export class AllocationGroup extends DataObject {
  public params: GroupParams;

  constructor(dal: DAL, params: GroupParams) {
    super(dal);
    this.params = params;
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
}
