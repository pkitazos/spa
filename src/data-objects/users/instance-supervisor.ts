import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { DAL } from "@/data-access";
import { SupervisorCapacityDetails } from "@/dto/supervisor_router";

export class InstanceSupervisor extends User {
  instance: AllocationInstance;

  constructor(dal: DAL, id: string, params: InstanceParams) {
    super(dal, id);
    this.instance = new AllocationInstance(dal, params);
  }

  public async get() {
    return await this.dal.supervisor.get(this.id, this.instance.params);
  }

  public async getSupervisionAllocations() {
    return await this.dal.supervisor.getSupervisionAllocations(
      this.id,
      this.instance.params,
    );
  }

  public async getCapacityDetails() {
    return await this.dal.supervisor.getCapacityDetails(
      this.id,
      this.instance.params,
    );
  }

  public async setCapacityDetails(capacities: SupervisorCapacityDetails) {
    return await this.dal.supervisor.setCapacityDetails(
      this.id,
      capacities,
      this.instance.params,
    );
  }
}
