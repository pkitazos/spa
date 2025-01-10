import {
  GroupParams,
  ProjectParams,
  SubGroupParams,
} from "@/lib/validations/params";

import { Admin } from "./admin";
import { GroupAdmin } from "./group-admin";
import { ProjectReader } from "./project-reader";
import { ProjectSupervisor } from "./project-supervisor";
import { SubGroupAdmin } from "./subgroup-admin";

export class User {
  constructor(_: unknown) {
    return;
  }

  public isAdmin() {
    // TODO implement this
    return true;
  }

  public toAdmin() {
    // todo this
    return new Admin(undefined);
  }

  public isGroupAdmin(_groupParams: GroupParams) {
    // TODO implement this
    return true;
  }

  public toGroupAdmin(_groupParams: GroupParams) {
    // todo this
    return new GroupAdmin(undefined);
  }

  public isSubGroupAdmin(_subGroupParams: SubGroupParams) {
    // TODO implement this
    return true;
  }

  public toSubGroupAdmin(_subGroupParams: SubGroupParams) {
    // todo this
    if (!this.isSubGroupAdmin) throw new Error("Permission denied!");

    return new SubGroupAdmin(undefined);
  }

  public isProjectSupervisor(_projectParams: ProjectParams) {
    //TODO this
    return true;
  }

  public toSupervisor(_projectParams: ProjectParams) {
    //TODO this
    return new ProjectSupervisor(undefined);
  }

  public isProjectReader(_projectParams: ProjectParams) {
    //TODO this
    return true;
  }

  public toReader(_projectParams: ProjectParams) {
    //TODO this
    return new ProjectReader(undefined);
  }
}

// A neat advantage of writing roles-as-classes:
// if DAL method requires admin permissions,
// you could add an argument of type `Admin`
// So if you can't construct an object of that type,
// you can't call that method - it'll type error
// You must provide proof that you have permission!
// Neat, huh?
// Of course, this requires the above functions to be implemented and to work
// And that the various `toXXX` methods error properly
// so the objects really aren't constructible when they shouldn't be
