import { InstanceParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { StudentProjectAllocationData } from "../student-project-allocation-data";

import { AllocationGroup } from "./group";
import { AllocationSubGroup } from "./subgroup";

import { DAL } from "@/data-access";
import { InstanceDTO } from "@/dto";
import { checkInstanceExistsUseCase } from "@/interactors";

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

  public async get() {
    return await this.dal.instance.get(this.params);
  }

  public async getStudentProjectAllocation() {
    return await StudentProjectAllocationData.fromDB(this.params);
  }

  public async getParentInstance(): Promise<AllocationInstance> {
    const { parentInstanceId } = await this.get();

    if (!parentInstanceId) throw new Error("No parent instance found");

    return new AllocationInstance(this.dal, {
      ...this.params,
      instance: parentInstanceId,
    });
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

  async getStudentAccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async setStudentAccess(access: boolean): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async getSupervisorAccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // TODO rename?
  async setSupervisorAccess(access: boolean): Promise<boolean> {
    return await this.dal.instance.setSupervisorProjectAllocationAccess(
      access,
      this.params,
    );
  }

  async getReaderAccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async setReaderAccess(access: boolean): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
