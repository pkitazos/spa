import { GroupParams } from "@/lib/validations/params";

export class AllocationGroup {
  public params: GroupParams;

  constructor(params: GroupParams) {
    this.params = params;
  }
}
