import { DAL } from "@/data-access";

export abstract class DataObject {
  protected dal: DAL;

  constructor(dal: DAL) {
    this.dal = dal;
  }
}
