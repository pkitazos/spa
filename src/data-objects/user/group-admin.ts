import { DB } from "@/db/types";
import { GroupParams } from "@/lib/validations/params";
import { AllocationGroup } from "../space/group";

import { User } from ".";

export class GroupAdmin extends User {
  allocationGroup: AllocationGroup;

  constructor(db: DB, id: string, groupParams: GroupParams) {
    super(db, id);
    this.allocationGroup = new AllocationGroup(db, groupParams);
  }
}
