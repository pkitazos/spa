import { SubGroupParams } from "@/lib/validations/params";

import { AllocationSubGroup } from "../spaces/subgroup";

import { User } from "./user";

import { DB } from "@/db/types";

export class SubGroupAdmin extends User {
  subGroup: AllocationSubGroup;

  constructor(db: DB, id: string, subGroupParams: SubGroupParams) {
    super(db, id);
    this.subGroup = new AllocationSubGroup(db, subGroupParams);
  }
}
