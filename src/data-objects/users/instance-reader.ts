import { InstanceParams } from "@/lib/validations/params";

import { AllocationInstance } from "../spaces/instance";

import { User } from "./user";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";

export class InstanceReader extends User {
  instance: AllocationInstance;

  constructor(dal: DAL, db: DB, id: string, params: InstanceParams) {
    super(dal, db, id);
    this.instance = new AllocationInstance(dal, db, params);
  }
}
