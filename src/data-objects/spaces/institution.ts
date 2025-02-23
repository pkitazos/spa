import { slugify } from "@/lib/utils/general/slugify";

import { DataObject } from "../data-object";

import { DAL } from "@/data-access";
import {
  allocationGroupToDTO,
  allocationInstanceToDTO,
} from "@/db/transformers";
import { DB } from "@/db/types";
import { InstanceDTO } from "@/dto";

export class Institution extends DataObject {
  constructor(dal: DAL, db: DB) {
    super(dal, db);
  }

  // WARNING bug see group.createSubroup
  public async createGroup(groupName: string) {
    return await this.db.allocationGroup
      .create({ data: { id: slugify(groupName), displayName: groupName } })
      .then(allocationGroupToDTO);
  }

  public async getAdmins() {
    const admins = await this.db.superAdmin.findMany({
      select: { user: true },
    });

    return admins.map(({ user }) => user);
  }

  public async getAllGroups() {
    const groups = await this.db.allocationGroup.findMany();

    return groups.map(allocationGroupToDTO);
  }

  public async getAllInstances(): Promise<InstanceDTO[]> {
    const instances = await this.db.allocationInstance.findMany();
    return instances.map(allocationInstanceToDTO);
  }
}
