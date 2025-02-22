import { SubGroupParams } from "@/lib/validations/params";

import { AllocationSubGroup } from "../spaces/subgroup";

import { User } from "./user";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";

export class SubGroupAdmin extends User {
  subGroup: AllocationSubGroup;

  constructor(dal: DAL, db: DB, id: string, subGroupParams: SubGroupParams) {
    super(dal, db, id);
    this.subGroup = new AllocationSubGroup(dal, db, subGroupParams);
  }
}
