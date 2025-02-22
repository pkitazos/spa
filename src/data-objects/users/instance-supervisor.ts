import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";
import { SupervisorCapacityDetails } from "@/dto/supervisor_router";

export class InstanceSupervisor extends User {
  instance: AllocationInstance;

  constructor(dal: DAL, db: DB, id: string, params: InstanceParams) {
    super(dal, db, id);
    this.instance = new AllocationInstance(dal, db, params);
  }

  public async toDTO() {
    return await this.dal.supervisor.getDetails(this.id, this.instance.params);
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

  public async getProjects() {
    return await this.dal.supervisor.getAllProjects(
      this.id,
      this.instance.params,
    );
  }

  public async getProjectsWithDetails() {
    return await this.dal.supervisor.getInstanceData(
      this.id,
      this.instance.params,
    );
  }

  public async countAllocationsInParent(parentInstanceId: string) {
    const parentInstanceParams = {
      ...this.instance.params,
      instance: parentInstanceId,
    };

    return await new InstanceSupervisor(
      this.dal,
      this.db,
      this.id,
      parentInstanceParams,
    )
      .getSupervisionAllocations()
      .then((allocations) => allocations.length);
  }

  public async countAllocations() {
    return await this.getSupervisionAllocations().then(
      (allocations) => allocations.length,
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
