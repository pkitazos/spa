import { uniqueById } from "@/lib/utils/list-unique";
import { ValidatedInstanceDetails } from "@/lib/validations/instance-form";
import { SubGroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { AllocationGroup } from "./group";
import { Institution } from "./institution";

import { DAL } from "@/data-access";
import {
  allocationInstanceToDTO,
  allocationSubGroupToDTO,
} from "@/db/transformers";
import { DB } from "@/db/types";
import { UserDTO } from "@/dto";

function toSubgroupId(params: SubGroupParams) {
  return { allocationGroupId: params.group, id: params.subGroup };
}

function subgroupExpand(params: SubGroupParams) {
  return {
    allocationGroupId: params.group,
    allocationSubGroupId: params.subGroup,
  };
}

export class AllocationSubGroup extends DataObject {
  public params: SubGroupParams;
  private _institution: Institution | undefined;
  private _group: AllocationGroup | undefined;

  constructor(dal: DAL, db: DB, params: SubGroupParams) {
    super(dal, db);
    this.params = params;
  }

  public async createInstance(newInstance: ValidatedInstanceDetails) {
    return this.dal.instance.create(this.params, newInstance);
  }

  public async exists() {
    return !!(await this.db.allocationSubGroup.findFirst({
      where: toSubgroupId(this.params),
    }));
  }

  public async get() {
    return await this.db.allocationSubGroup
      .findFirstOrThrow({ where: toSubgroupId(this.params) })
      .then(allocationSubGroupToDTO);
  }

  public async getInstances() {
    return await this.db.allocationInstance
      .findMany({ where: subgroupExpand(this.params) })
      .then((data) => data.map(allocationInstanceToDTO));
  }

  public async getAdmins(): Promise<UserDTO[]> {
    const admins = await this.db.subGroupAdmin.findMany({
      where: subgroupExpand(this.params),
      select: { user: true },
    });

    return admins.map(({ user }) => user);
  }

  public async getManagers(): Promise<UserDTO[]> {
    const subGroupAdmins = await this.getAdmins();
    const groupAdmins = await this.group.getAdmins();
    const superAdmins = await this.institution.getAdmins();

    return uniqueById([...subGroupAdmins, ...groupAdmins, ...superAdmins]);
  }

  public async delete() {
    await this.db.allocationSubGroup
      .delete({ where: { subGroupId: toSubgroupId(this.params) } })
      .then(allocationSubGroupToDTO);
  }

  get institution() {
    if (!this._institution)
      this._institution = new Institution(this.dal, this.db);
    return this._institution;
  }

  get group() {
    if (!this._group)
      this._group = new AllocationGroup(this.dal, this.db, this.params);
    return this._group;
  }
}
