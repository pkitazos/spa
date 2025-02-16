import { DataObject } from "./data-object";

import { DAL } from "@/data-access";

export class Algorithm extends DataObject {
  id: string;

  constructor(dal: DAL, id: string) {
    super(dal);
    this.id = id;
  }

  public async get() {
    return this.dal.algorithm.get(this.id);
  }
}
