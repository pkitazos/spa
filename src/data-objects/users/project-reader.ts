import { ProjectParams } from "@/lib/validations/params";

import { Project } from "../spaces/project";

import { User } from "./user";

import { DAL } from "@/data-access";
import { DB } from "@/db/types";

export class ProjectReader extends User {
  project: Project;

  constructor(dal: DAL, db: DB, id: string, projectParams: ProjectParams) {
    super(dal, db, id);
    this.project = new Project(dal, db, projectParams);
  }
}
