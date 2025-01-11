import { SubGroupParams } from "@/lib/validations/params";

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

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.dal, this.params);
    return this._group;
  }
}
