import { expand } from "@/lib/utils/general/instance-params";
import { ProjectParams } from "@/lib/validations/params";

import { DataObject } from "../data-object";

import { AllocationGroup } from "./group";
import { AllocationInstance } from "./instance";
import { AllocationSubGroup } from "./subgroup";

import { DB } from "@/db/types";

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
}
