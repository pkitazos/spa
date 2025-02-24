import { ProjectParams } from "@/lib/validations/params";

import { Project } from "../spaces/project";

import { User } from "./user";

import { DB } from "@/db/types";

export class ProjectSupervisor extends User {
  project: Project;

  constructor(db: DB, id: string, projectParams: ProjectParams) {
    super(db, id);
    this.project = new Project(db, projectParams);
  }
}
