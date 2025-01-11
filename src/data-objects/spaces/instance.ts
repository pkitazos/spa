import { InstanceParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { StudentProjectAllocationData } from "../student-project-allocation-data";

import { AllocationGroup } from "./group";
import { AllocationSubGroup } from "./subgroup";

import { DAL } from "@/data-access";
import { checkInstanceExistsUseCase, getInstanceUseCase } from "@/interactors";

export class AllocationInstance extends DataObject {
  public params: InstanceParams;
  private _group: AllocationGroup | undefined;
  private _subgroup: AllocationSubGroup | undefined;

  constructor(dal: DAL, params: InstanceParams) {
    super(dal);
    this.params = params;
  }

  public exists() {
    return checkInstanceExistsUseCase({ params: this.params });
  }

  public fetch() {
    return getInstanceUseCase({ params: this.params });
  }

  public getStudentProjectAllocation() {
    return StudentProjectAllocationData.fromDB(this.params);
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
}

// how to factor these DB dependent methods?

// several options
// one is to include db in constructor
// annother is to pass db to method.
// passing to constructor could be very attractive - it makes the call sites very clean indeed.
// but perhaps it makes testing more difficult. unclear.
