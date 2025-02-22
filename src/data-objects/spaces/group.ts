import { GroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";
import { GroupDTO, SubGroupDTO, UserDTO } from "@/dto";

export class AllocationGroup extends DataObject {
  public params: GroupParams;

  constructor(dal: DAL, db: DB, params: GroupParams) {
    super(dal, db);
    this.params = params;
  }

  public async addAdmin(userId: string) {
    // check if the user exists
    const exists = await this.dal.user.exists(userId);
    if (!exists) throw new Error("User does not exist");

    const isGroupAdmin = await this.dal.user.isGroupAdmin(userId, this.params);
    if (isGroupAdmin) throw new Error("User is already a group admin");

    return await this.dal.groupAdmin.create(userId, this.params);
    // if they don't exist - create them
    // add them as an admin
  }

  public async createSubGroup(name: string) {
    return await this.dal.subGroup.create(this.params.group, name);
  }

  public async exists(): Promise<boolean> {
    return await this.dal.group.exists(this.params);
  }

  public async get(): Promise<GroupDTO> {
    return await this.dal.group.get(this.params);
  }

  public async getSubGroups(): Promise<SubGroupDTO[]> {
    return await this.dal.group.getSubGroups(this.params);
  }

  public async getAdmins(): Promise<UserDTO[]> {
    return await this.dal.group.getAdmins(this.params);
  }

  public async getManagers(): Promise<UserDTO[]> {
    const groupAdmins = await this.getAdmins();
    const superAdmins = await this.dal.superAdmin.getAll();
    // TODO distinct (nubs)
    return [...groupAdmins, ...superAdmins];
  }

  public async delete() {
    return await this.dal.group.delete(this.params);
  }
}
