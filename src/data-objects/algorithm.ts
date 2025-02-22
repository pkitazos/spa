import { DataObject } from "./data-object";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";

export class Algorithm extends DataObject {
  id: string;

  constructor(dal: DAL, db: DB, id: string) {
    super(dal, db);
    this.id = id;
  }

  public async get() {
    return this.dal.algorithm.get(this.id);
  }
}
