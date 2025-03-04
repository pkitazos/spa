import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { slugify } from "@/lib/utils/general/slugify";
import { uniqueById } from "@/lib/utils/list-unique";
import { builtInAlgorithms } from "@/lib/validations/algorithm";
import { SubGroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { User } from "../users/user";

import { AllocationGroup } from "./group";
import { Institution } from "./institution";

import { Transformers as T } from "@/db/transformers";
import { DB, New } from "@/db/types";
import { FlagDTO, InstanceDTO, SubGroupDTO, TagDTO, UserDTO } from "@/dto";

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

  constructor(db: DB, params: SubGroupParams) {
    super(db);
    this.params = params;
  }

  public async createInstance({
    newInstance,
    flags,
    tags,
  }: {
    newInstance: Omit<InstanceDTO, "instance">;
    flags: New<FlagDTO>[];
    tags: New<TagDTO>[];
  }) {
    const instanceSlug = slugify(newInstance.displayName);

    const params = { ...this.params, instance: instanceSlug };

    await this.db.$transaction(async (tx) => {
      await tx.allocationInstance.create({
        data: { ...toInstanceId(params), ...newInstance },
      });

      await tx.flag.createMany({
        data: flags.map((f) => ({
          ...expand(params),
          title: f.title,
          description: f.description,
        })),
      });

      await tx.tag.createMany({
        data: tags.map((t) => ({ ...expand(params), title: t.title })),
      });

      await tx.algorithm.createMany({
        data: builtInAlgorithms.map((alg) => ({ ...expand(params), ...alg })),
      });
    });
  }

  public async exists(): Promise<boolean> {
    return !!(await this.db.allocationSubGroup.findFirst({
      where: toSubgroupId(this.params),
    }));
  }

  public async get(): Promise<SubGroupDTO> {
    return await this.db.allocationSubGroup
      .findFirstOrThrow({ where: toSubgroupId(this.params) })
      .then(T.toAllocationSubGroupDTO);
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    return await this.db.allocationInstance
      .findMany({ where: subgroupExpand(this.params) })
      .then((data) => data.map(T.toAllocationInstanceDTO));
  }

  public async isSubGroupAdmin(userId: string): Promise<boolean> {
    return await new User(this.db, userId).isSubGroupAdmin(this.params);
  }

  public async linkAdmin(userId: string): Promise<void> {
    await this.db.subGroupAdmin.create({
      data: { userId, ...subgroupExpand(this.params) },
    });
  }

  public async unlinkAdmin(userId: string): Promise<void> {
    await this.db.subGroupAdmin.delete({
      where: { subGroupAdminId: { userId, ...subgroupExpand(this.params) } },
    });
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

  public async delete(): Promise<SubGroupDTO> {
    return await this.db.allocationSubGroup
      .delete({ where: { subGroupId: toSubgroupId(this.params) } })
      .then(T.toAllocationSubGroupDTO);
  }

  get institution() {
    if (!this._institution) this._institution = new Institution(this.db);
    return this._institution;
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.db, this.params);
    return this._group;
  }
}
