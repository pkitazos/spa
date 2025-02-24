import { DataObject } from "./data-object";

import { DB } from "@/db/types";

export class Algorithm extends DataObject {
  id: string;

  constructor(db: DB, id: string) {
    super(db);
    this.id = id;
  }

  // TODO should return a DTO
  public async get() {
    return await this.db.algorithmConfig.findFirstOrThrow({
      where: { id: this.id },
    });
  }
}
