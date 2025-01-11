import { SubGroupParams } from "@/lib/validations/params";

import { AllocationSubGroup } from "../spaces/subgroup";

import { User } from "./user";

import { DAL } from "@/data-access";

export class SubGroupAdmin extends User {
  subGroup: AllocationSubGroup;

  constructor(dal: DAL, id: string, subGroupParams: SubGroupParams) {
    super(dal, id);
    this.subGroup = new AllocationSubGroup(subGroupParams);
  }
}
