import {
  type InstanceDTO,
  type FlagDTO,
  type TagDTO,
  builtInAlgorithms,
  type SubGroupDTO,
  type UserDTO,
} from "@/dto";

import { Transformers as T } from "@/db/transformers";
import { type DB, type New } from "@/db/types";

import { toInstanceId, expand } from "@/lib/utils/general/instance-params";
import { slugify } from "@/lib/utils/general/slugify";
import { uniqueById } from "@/lib/utils/list-unique";
import { type SubGroupParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { User } from "../user";

import { AllocationGroup } from "./group";
import { Institution } from "./institution";

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
    newInstance: { group: _group, subGroup: _subGroup, ...newInstance },
    flags,
    tags,
  }: {
    newInstance: Omit<InstanceDTO, "instance">;
    flags: FlagDTO[];
    tags: New<TagDTO>[];
  }) {
    const instanceSlug = slugify(newInstance.displayName);

    const params = { ...this.params, instance: instanceSlug };

    await this.db.$transaction(async (tx) => {
      await tx.allocationInstance.create({
        data: { ...toInstanceId(params), ...newInstance },
      });

      const flagData = await tx.flag.createManyAndReturn({
        data: flags.map((f) => ({
          ...expand(params),
          id: f.id,
          displayName: f.displayName,
          description: f.description,
        })),
        skipDuplicates: true,
      });

      const _flagDisplayNameToId = flagData.reduce(
        (acc, val) => ({ ...acc, [val.displayName]: val.id }),
        {} as Record<string, string>,
      );

      await tx.tag.createMany({
        data: tags.map((t) => ({ ...expand(params), title: t.title })),
      });

      await tx.algorithm.createMany({
        data: builtInAlgorithms.map((alg) => ({ ...expand(params), ...alg })),
      });

      // const units = await tx.unitOfAssessment.createManyAndReturn({
      //   data: flags.flatMap((f) =>
      //     f.unitsOfAssessment.map((a) => ({
      //       ...expand(params),
      //       flagId: flagDisplayNameToId[f.displayName],
      //       title: a.title,
      //       weight: a.weight,
      //       studentSubmissionDeadline: a.studentSubmissionDeadline,
      //       markerSubmissionDeadline: a.markerSubmissionDeadline,
      //       allowedMarkerTypes: a.allowedMarkerTypes,
      //     })),
      //   ),
      // });

      // const unitTitleToId = units.reduce(
      //   (acc, val) => ({ ...acc, [`${val.flagId}${val.title}`]: val.id }),
      //   {} as Record<string, string>,
      // );

      // await tx.assessmentCriterion.createMany({
      //   data: flags.flatMap((f) =>
      //     f.unitsOfAssessment.flatMap((u) =>
      //       u.components.map((c) => ({
      //         unitOfAssessmentId:
      //           unitTitleToId[`${flagTitleToId[f.displayName]}${u.title}`],
      //         title: c.title,
      //         description: c.description,
      //         weight: c.weight,
      //         layoutIndex: c.layoutIndex,
      //       })),
      //     ),
      //   ),
      // });
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
      .then((x) => T.toAllocationSubGroupDTO(x));
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    return await this.db.allocationInstance
      .findMany({ where: subgroupExpand(this.params) })
      .then((data) => data.map((x) => T.toAllocationInstanceDTO(x)));
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
      .then((x) => T.toAllocationSubGroupDTO(x));
  }

  get institution() {
    this._institution ??= new Institution(this.db);
    return this._institution;
  }

  get group() {
    this._group ??= new AllocationGroup(this.db, this.params);
    return this._group;
  }
}
