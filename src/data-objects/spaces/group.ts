import { GroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { DAL } from "@/data-access";
import { GroupDTO, SubGroupDTO, UserDTO } from "@/dto";

export class AllocationGroup extends DataObject {
  public params: GroupParams;

  constructor(dal: DAL, params: GroupParams) {
    super(dal);
    this.params = params;
  }

  static async create(dal: DAL, name: string) {
    return await dal.group.create(name);
  }

  async exists(): Promise<boolean> {
    return await this.dal.group.exists(this.params);
  }

  async get(): Promise<GroupDTO> {
    return await this.dal.group.get(this.params);
  }

  async getSubGroups(): Promise<SubGroupDTO[]> {
    return await this.dal.group.getSubGroups(this.params);
  }

  async getAdmins(): Promise<UserDTO[]> {
    return await this.dal.group.getAdmins(this.params);
  }

  async getManagers(): Promise<UserDTO[]> {
    const groupAdmins = await this.getAdmins();
    const superAdmins = await this.dal.superAdmin.getAll();
    // TODO distinct (nubs)
    return [...groupAdmins, ...superAdmins];
  }

  async delete() {
    return await this.dal.group.delete(this.params);
  }
}
