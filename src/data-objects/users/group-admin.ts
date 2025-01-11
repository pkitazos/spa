import { GroupParams } from "@/lib/validations/params";

import { AllocationGroup } from "../spaces/group";

import { User } from "./user";

import { DAL } from "@/data-access";

export class GroupAdmin extends User {
  allocationGroup: AllocationGroup;

  constructor(dal: DAL, id: string, groupParams: GroupParams) {
    super(dal, id);
    this.allocationGroup = new AllocationGroup(groupParams);
  }
}
