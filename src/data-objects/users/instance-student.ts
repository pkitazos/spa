import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { DAL } from "@/data-access";

export class InstanceStudent extends User {
  instance: AllocationInstance;

  constructor(dal: DAL, id: string, params: InstanceParams) {
    super(dal, id);
    this.instance = new AllocationInstance(params);
  }

  public async hasSelfDefinedProject(): Promise<boolean> {
    return await this.dal.student.hasSelfDefinedProject(
      this.id,
      this.instance.params,
    );
  }
}
