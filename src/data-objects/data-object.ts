import { DAL } from "@/data-access";
import { DB } from "@/db/types";
export abstract class DataObject {
  /**
   * @deprecated use DB instead
   */
  protected dal: DAL;

  protected db: DB;

  constructor(dal: DAL, db: DB) {
    this.dal = dal;
    this.db = db;
  }
}
