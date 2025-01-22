import { DataObject } from "../data-object";

import { DAL } from "@/data-access";
import { InstanceDTO } from "@/dto";

export class Institution extends DataObject {
  constructor(dal: DAL) {
    super(dal);
  }

  static getAllInstances(dal: DAL): Promise<InstanceDTO[]> {
    return dal.instance.getAll();
  }
}
