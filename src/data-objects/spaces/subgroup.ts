import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { slugify } from "@/lib/utils/general/slugify";
import { uniqueById } from "@/lib/utils/list-unique";
import { builtInAlgorithms } from "@/lib/validations/algorithm";
import { ValidatedInstanceDetails } from "@/lib/validations/instance-form";
import { SubGroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { User } from "../users/user";

import { AllocationGroup } from "./group";
import { Institution } from "./institution";

import {
  allocationInstanceToDTO,
  allocationSubGroupToDTO,
} from "@/db/transformers";
import { DB } from "@/db/types";
import { InstanceDTO, SubGroupDTO, UserDTO } from "@/dto";

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

  // TODO input type (should be InstanceDTO?)
  public async createInstance(newInstance: ValidatedInstanceDetails) {
    const instanceSlug = slugify(newInstance.instanceName);

    const params = { ...this.params, instance: instanceSlug };

    await this.db.$transaction(async (tx) => {
      await tx.allocationInstance.create({
        data: {
          ...toInstanceId(params),
          displayName: newInstance.instanceName,
          minStudentPreferences: newInstance.minPreferences,
          maxStudentPreferences: newInstance.maxPreferences,
          maxStudentPreferencesPerSupervisor:
            newInstance.maxPreferencesPerSupervisor,
          studentPreferenceSubmissionDeadline:
            newInstance.preferenceSubmissionDeadline,
          projectSubmissionDeadline: newInstance.projectSubmissionDeadline,
          minReaderPreferences: 0, //todo
          maxReaderPreferences: 10, //todo
          readerPreferenceSubmissionDeadline: new Date(), //todo
        },
      });

      await tx.flag.createMany({
        data: newInstance.flags.map(({ title }) => ({
          ...expand(params),
          title,
          description: "", // TODO
        })),
      });

      await tx.tag.createMany({
        data: newInstance.tags.map(({ title }) => ({
          title,
          ...expand(params),
        })),
      });

      await tx.algorithmConfig.createMany({
        data: builtInAlgorithms.map((a) => ({
          ...a,
          matchingResultData: JSON.stringify({}),
          ...expand(params),
        })),
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
      .then(allocationSubGroupToDTO);
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    return await this.db.allocationInstance
      .findMany({ where: subgroupExpand(this.params) })
      .then((data) => data.map(allocationInstanceToDTO));
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
      .then(allocationSubGroupToDTO);
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
