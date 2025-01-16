import { InstanceParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { StudentProjectAllocationData } from "../student-project-allocation-data";

import { AllocationGroup } from "./group";
import { AllocationSubGroup } from "./subgroup";

import { DAL } from "@/data-access";
import { InstanceDTO } from "@/dto";
import { checkInstanceExistsUseCase, getInstanceUseCase } from "@/interactors";

export class AllocationInstance extends DataObject {
  public params: InstanceParams;
  private _group: AllocationGroup | undefined;
  private _subgroup: AllocationSubGroup | undefined;

  constructor(dal: DAL, params: InstanceParams) {
    super(dal);
    this.params = params;
  }

  public exists() {
    return checkInstanceExistsUseCase({ params: this.params });
  }

  public fetch() {
    return getInstanceUseCase({ params: this.params });
  }

  public async getStudentProjectAllocation() {
    return await StudentProjectAllocationData.fromDB(this.params);
  }

  public async getStage() {
    return await this.dal.instance.getStage(this.params);
  }

  public async isForked(): Promise<boolean> {
    return await this.dal.instance.isForked(this.params);
  }

  public async getParentInstanceId(): Promise<string | undefined> {
    return await this.dal.instance.getParentInstanceId(this.params);
  }

  public async getParentInstance(): Promise<AllocationInstance> {
    const parentInstanceId = await this.dal.instance.getParentInstanceId(
      this.params,
    );
    if (!parentInstanceId) {
      throw new Error("No parent instance found");
    }

    return new AllocationInstance(this.dal, {
      ...this.params,
      instance: parentInstanceId,
    });
  }

  public getSupervisorProjectAllocationAccess() {
    return this.dal.instance.getSupervisorProjectAllocationAccess(this.params);
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.dal, this.params);
    return this._group;
  }

  get subGroup() {
    if (!this._subgroup)
      this._subgroup = new AllocationSubGroup(this.dal, this.params);
    return this._subgroup;
  }

  public static eq = (a: InstanceDTO, b: InstanceDTO) =>
    a.group === b.group &&
    a.subGroup === b.subGroup &&
    a.instance === b.instance;

  // TODO this
  public allocationAccess = {
    project: {
      async getStudent(): Promise<boolean> {
        throw new Error("Method not implemented.");
      },

      async setStudent(access: boolean): Promise<boolean> {
        throw new Error("Method not implemented.");
      },

      async getSupervisor(): Promise<boolean> {
        throw new Error("Method not implemented.");
      },

      async setSupervisor(access: boolean): Promise<boolean> {
        throw new Error("Method not implemented.");
      },
    },
  };
}
