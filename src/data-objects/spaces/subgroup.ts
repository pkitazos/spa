import { SubGroupParams } from "@/lib/validations/params";

import { AllocationGroup } from "./group";

export class AllocationSubGroup {
  public params: SubGroupParams;
  private _group: AllocationGroup | undefined;

  constructor(params: SubGroupParams) {
    this.params = params;
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.params);
    return this._group;
  }
}
