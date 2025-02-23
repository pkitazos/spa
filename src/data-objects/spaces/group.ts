import { slugify } from "@/lib/utils/general/slugify";
import { uniqueById } from "@/lib/utils/list-unique";
import { GroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { User } from "../users/user";

import { Institution } from "./institution";

import { DAL } from "@/data-access";
import {
  allocationGroupToDTO,
  allocationSubGroupToDTO,
} from "@/db/transformers";
import { DB } from "@/db/types";
import { GroupDTO, SubGroupDTO, UserDTO } from "@/dto";

export class AllocationGroup extends DataObject {
  public params: GroupParams;
  private _institution: Institution | undefined;

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

  public async removeAdmin(userId: string) {
    await this.db.groupAdmin.delete({
      where: { groupAdminId: { allocationGroupId: this.params.group, userId } },
    });
  }

  public async createSubGroup(displayName: string): Promise<SubGroupDTO> {
    // WARNING BUG
    // imagine the following:
    // create SG hello
    // rename hello -> goodbye
    // create SG hello
    // This will fail!
    // IT SHOULD NOT!
    // problem: slug & id are the same thing
    // this issue likely persists across all spaces
    // (I haven't checked)
    return await this.db.allocationSubGroup
      .create({
        data: {
          displayName,
          id: slugify(displayName),
          allocationGroupId: this.params.group,
        },
      })
      .then(allocationSubGroupToDTO);
  }

  public async exists(): Promise<boolean> {
    return !!(await this.db.allocationGroup.findFirst({
      where: { id: this.params.group },
    }));
  }

  public async get(): Promise<GroupDTO> {
    return await this.db.allocationGroup
      .findFirstOrThrow({ where: { id: this.params.group } })
      .then(allocationGroupToDTO);
  }

  public async getSubGroups(): Promise<SubGroupDTO[]> {
    const subgroups = await this.db.allocationSubGroup.findMany({
      where: { allocationGroupId: this.params.group },
    });

    return subgroups.map(allocationSubGroupToDTO);
  }

  public async getAdmins(): Promise<UserDTO[]> {
    const admins = await this.db.groupAdmin.findMany({
      where: { allocationGroupId: this.params.group },
      select: { user: true },
    });

    return admins.map(({ user }) => user);
  }

  public async getManagers(): Promise<UserDTO[]> {
    const groupAdmins = await this.getAdmins();
    const superAdmins = await this.institution.getAdmins();

    return uniqueById([...groupAdmins, ...superAdmins]);
  }

  isGroupAdmin(userId: string) {
    return new User(this.dal, this.db, userId).isGroupAdmin(this.params);
  }

  public async delete() {
    return await this.db.allocationGroup
      .delete({ where: { id: this.params.group } })
      .then(allocationGroupToDTO);
  }

  get institution() {
    if (!this._institution)
      this._institution = new Institution(this.dal, this.db);
    return this._institution;
  }
}
