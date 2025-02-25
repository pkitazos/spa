// TODO kill
import { GroupParams } from "@/lib/validations/params";

import { AllocationGroup } from "../spaces/group";

import { User } from "./user";

import { DB } from "@/db/types";

export class GroupAdmin extends User {
  allocationGroup: AllocationGroup;

  constructor(db: DB, id: string, groupParams: GroupParams) {
    super(db, id);
    this.allocationGroup = new AllocationGroup(db, groupParams);
  }
}
