import { DB } from "@/db/types";
import { SubGroupParams } from "@/lib/validations/params";
import { AllocationSubGroup } from "../space/sub-group";
import { User } from ".";

export class SubGroupAdmin extends User {
  subGroup: AllocationSubGroup;

  constructor(db: DB, id: string, subGroupParams: SubGroupParams) {
    super(db, id);
    this.subGroup = new AllocationSubGroup(db, subGroupParams);
  }
}
