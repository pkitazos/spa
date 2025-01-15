import { ProjectParams } from "@/lib/validations/params";

import { Project } from "../spaces/project";

import { User } from "./user";

import { DAL } from "@/data-access";

export class ProjectReader extends User {
  project: Project;

  constructor(dal: DAL, id: string, projectParams: ProjectParams) {
    super(dal, id);
    this.project = new Project(dal, projectParams);
  }
}
