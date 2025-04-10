import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import { ProjectDTO, FlagDTO } from "@/dto";
import { toPP2 } from "@/lib/utils/general/instance-params";
import { ProjectParams } from "@/lib/validations/params";
import { DataObject } from "./data-object";
import { AllocationGroup } from "./space/group";
import { AllocationInstance } from "./space/instance";
import { AllocationSubGroup } from "./space/sub-group";

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
    return !!(await this.db.project.findFirst({ where: toPP2(this.params) }));
  }

  public async get(): Promise<ProjectDTO> {
    return await this.db.project
      .findFirstOrThrow({
        where: toPP2(this.params),
        include: {
          flagsOnProject: { include: { flag: true } },
          tagsOnProject: { include: { tag: true } },
        },
      })
      .then(T.toProjectDTO);
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
    const data = await this.db.project.findFirstOrThrow({
      where: toPP2(this.params),
      include: { flagsOnProject: { include: { flag: true } } },
    });

    return data.flagsOnProject.map((f) => T.toFlagDTO(f.flag));
  }

  public async delete(): Promise<void> {
    await this.db.project.delete({ where: toPP2(this.params) });
  }
}
