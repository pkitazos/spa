import { GroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { DAL } from "@/data-access";

export class AllocationGroup extends DataObject {
  public params: GroupParams;

  constructor(dal: DAL, params: GroupParams) {
    super(dal);
    this.params = params;
  }

  async exists(params: GroupParams): Promise<boolean> {
    return await this.dal.group.exists(params);
  }
}
