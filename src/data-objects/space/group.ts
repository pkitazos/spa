import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import { SubGroupDTO, GroupDTO, UserDTO } from "@/dto";
import { slugify } from "@/lib/utils/general/slugify";
import { uniqueById } from "@/lib/utils/list-unique";
import { GroupParams } from "@/lib/validations/params";
import { DataObject } from "../data-object";
import { Institution } from "./institution";
import { User } from "../user";

export class AllocationGroup extends DataObject {
  public params: GroupParams;
  private _institution: Institution | undefined;

  constructor(db: DB, params: GroupParams) {
    super(db);
    this.params = params;
  }

  public async linkAdmin(userId: string): Promise<void> {
    await this.db.groupAdmin.create({
      data: { userId, allocationGroupId: this.params.group },
    });
  }

  public async unlinkAdmin(userId: string): Promise<void> {
    await this.db.groupAdmin.delete({
      where: { groupAdminId: { userId, allocationGroupId: this.params.group } },
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
          id: slugify(displayName),
          displayName,
          allocationGroupId: this.params.group,
        },
      })
      .then(T.toAllocationSubGroupDTO);
  }

  public async exists(): Promise<boolean> {
    return !!(await this.db.allocationGroup.findFirst({
      where: { id: this.params.group },
    }));
  }

  public async get(): Promise<GroupDTO> {
    return await this.db.allocationGroup
      .findFirstOrThrow({ where: { id: this.params.group } })
      .then(T.toAllocationGroupDTO);
  }

  public async getSubGroups(): Promise<SubGroupDTO[]> {
    const subgroups = await this.db.allocationSubGroup.findMany({
      where: { allocationGroupId: this.params.group },
    });

    return subgroups.map(T.toAllocationSubGroupDTO);
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

  public async isGroupAdmin(userId: string): Promise<boolean> {
    const user = new User(this.db, userId);
    return await user.isGroupAdmin(this.params);
  }

  public async delete(): Promise<GroupDTO> {
    return await this.db.allocationGroup
      .delete({ where: { id: this.params.group } })
      .then(T.toAllocationGroupDTO);
  }

  get institution() {
    if (!this._institution) this._institution = new Institution(this.db);
    return this._institution;
  }
}
