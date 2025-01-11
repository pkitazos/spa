import { ProjectParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { AllocationGroup } from "./group";
import { AllocationInstance } from "./instance";
import { AllocationSubGroup } from "./subgroup";

import { DAL } from "@/data-access";

export class Project extends DataObject {
  public params: ProjectParams;
  private _group: AllocationGroup | undefined;
  private _subgroup: AllocationSubGroup | undefined;
  private _instance: AllocationInstance | undefined;

  constructor(dal: DAL, params: ProjectParams) {
    super(dal);
    this.params = params;
  }

  public exists() {
    // todo
    return true;
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.dal, this.params);
    return this._group;
  }

  get subGroup() {
    if (!this._subgroup)
      this._subgroup = new AllocationSubGroup(this.dal, this.params);
    return this._subgroup;
  }

  get instance() {
    if (!this._instance)
      this._instance = new AllocationInstance(this.dal, this.params);
    return this._instance;
  }
}
