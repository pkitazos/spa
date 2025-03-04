import { DB } from "@/db/types";
export abstract class DataObject {
  protected db: DB;

  constructor(db: DB) {
    this.db = db;
  }
}
