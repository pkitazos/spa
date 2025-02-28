import { expand, toPP2 } from "@/lib/utils/general/instance-params";
import { ProjectParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { AllocationGroup } from "./group";
import { AllocationInstance } from "./instance";
import { AllocationSubGroup } from "./subgroup";

import { DB } from "@/db/types";
import { FlagDTO } from "@/dto";
import { flagToDTO } from "@/db/transformers";

export class Project extends DataObject {
  public params: ProjectParams;
  private _group: AllocationGroup | undefined;
  private _subgroup: AllocationSubGroup | undefined;
  private _instance: AllocationInstance | undefined;

  constructor(db: DB, params: ProjectParams) {
    super(db);
    this.params = params;
  }

  public async exists() {
    return !!(await this.db.projectInInstance.findFirst({
      where: { projectId: this.params.projectId, ...expand(this.params) },
    }));
  }

  get group() {
    if (!this._group) this._group = new AllocationGroup(this.db, this.params);
    return this._group;
  }

  get subGroup() {
    if (!this._subgroup)
      this._subgroup = new AllocationSubGroup(this.db, this.params);
    return this._subgroup;
  }

  get instance() {
    if (!this._instance)
      this._instance = new AllocationInstance(this.db, this.params);
    return this._instance;
  }

  public async getFlags(): Promise<FlagDTO[]> {
    const data = await this.db.projectInInstance.findFirstOrThrow({
      where: toPP2(this.params),
      include: {
        details: { include: { flagsOnProject: { include: { flag: true } } } },
      },
    });

    return data.details.flagsOnProject.map((f) => flagToDTO(f.flag));
  }

  public async delete(): Promise<void> {
    await this.db.$transaction([
      this.db.projectDetails.deleteMany({
        where: { projectInInstance: { every: toPP2(this.params) } },
      }),
      this.db.projectInInstance.delete({
        where: { projectInInstanceId: toPP2(this.params) },
      }),
    ]);
  }
}
