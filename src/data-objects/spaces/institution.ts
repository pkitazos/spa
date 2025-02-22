import { DataObject } from "../data-object";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";
import { InstanceDTO } from "@/dto";

export class Institution extends DataObject {
  constructor(dal: DAL, db: DB) {
    super(dal, db);
  }

  public async createGroup(groupName: string) {
    return await this.dal.group.create(groupName);
  }

  public async getAllInstances(): Promise<InstanceDTO[]> {
    return await this.dal.instance.getAll();
  }

  public async getAllSuperAdmins() {
    return await this.dal.superAdmin.getAll();
  }

  public async getAllGroups() {
    return await this.dal.group.getAll();
  }
}
