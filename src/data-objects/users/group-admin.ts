import { GroupParams } from "@/lib/validations/params";

import { AllocationGroup } from "../spaces/group";

import { User } from "./user";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";

export class GroupAdmin extends User {
  allocationGroup: AllocationGroup;

  constructor(dal: DAL, db: DB, id: string, groupParams: GroupParams) {
    super(dal, db, id);
    this.allocationGroup = new AllocationGroup(dal, db, groupParams);
  }
}
