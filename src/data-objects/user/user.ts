import { Transformers as T } from "@/db/transformers";
import { DB, Role } from "@/db/types";
import {
  UserDTO,
  InstanceDTO,
  InstanceUserDTO,
  GroupDTO,
  SubGroupDTO,
} from "@/dto";
import { expand } from "@/lib/utils/general/instance-params";
import { ValidatedSegments } from "@/lib/validations/breadcrumbs";
import {
  GroupParams,
  SubGroupParams,
  InstanceParams,
} from "@/lib/validations/params";
import { DataObject } from "../data-object";
import { Institution } from "../space/institution";
import {
  GroupAdmin,
  Marker,
  Reader,
  Student,
  SubGroupAdmin,
  SuperAdmin,
  Supervisor,
} from ".";

export class User extends DataObject {
  id: string;
  private _data: UserDTO | undefined;

  constructor(db: DB, id: string) {
    super(db);
    this.id = id;
  }

  public async toDTO(): Promise<UserDTO> {
    if (!this._data) {
      this._data = await this.db.user.findFirstOrThrow({
        where: { id: this.id },
      });
    }
    return this._data;
  }

  static fromDTO(db: DB, data: UserDTO) {
    const user = new User(db, data.id);
    user._data = data;
  }

  // --- kind checks:
  public async isSuperAdmin(): Promise<boolean> {
    return !!(await this.db.superAdmin.findFirst({
      where: { userId: this.id },
    }));
  }

  public async isGroupAdmin(groupParams: GroupParams): Promise<boolean> {
    return !!(await this.db.groupAdmin.findFirst({
      where: { userId: this.id, allocationGroupId: groupParams.group },
    }));
  }

  public async isSubGroupAdmin(
    subGroupParams: SubGroupParams,
  ): Promise<boolean> {
    return !!(await this.db.subGroupAdmin.findFirst({
      where: {
        userId: this.id,
        allocationSubGroupId: subGroupParams.subGroup,
        allocationGroupId: subGroupParams.group,
      },
    }));
  }

  public async isGroupAdminOrBetter(params: GroupParams): Promise<boolean> {
    return (await this.isSuperAdmin()) || (await this.isGroupAdmin(params));
  }

  public async isSubGroupAdminOrBetter(
    params: SubGroupParams,
  ): Promise<boolean> {
    return (
      (await this.isGroupAdminOrBetter({ group: params.group })) ||
      (await this.isSubGroupAdmin(params))
    );
  }

  public async isStudent(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.studentDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public async isSupervisor(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.supervisorDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public async isProjectSupervisor(id: string): Promise<boolean> {
    return !!(await this.db.project.findFirst({
      where: { id, supervisorId: this.id },
    }));
  }

  public async isReader(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.readerDetails.findFirst({
      where: { ...expand(params), userId: this.id },
    }));
  }

  public async isMarker(params: InstanceParams): Promise<boolean> {
    return (await this.isSupervisor(params)) || (await this.isReader(params));
  }

  public async isStaff(params: InstanceParams): Promise<boolean> {
    return (
      (await this.isSubGroupAdminOrBetter(params)) ||
      (await this.isMarker(params))
    );
  }

  public async isMember(params: InstanceParams): Promise<boolean> {
    return (await this.isStaff(params)) || (await this.isStudent(params));
  }

  public async getRolesInInstance(
    instanceParams: InstanceParams,
  ): Promise<Set<Role>> {
    const roles = new Set<Role>();

    if (await this.isSubGroupAdminOrBetter(instanceParams)) {
      roles.add(Role.ADMIN);
    }
    if (await this.isStudent(instanceParams)) {
      roles.add(Role.STUDENT);
    }
    if (await this.isReader(instanceParams)) {
      roles.add(Role.READER);
    }
    if (await this.isSupervisor(instanceParams)) {
      roles.add(Role.SUPERVISOR);
    }

    return roles;
  }

  // --- conversions
  public toUser(): User {
    return new User(this.db, this.id);
  }

  public async toSuperAdmin(): Promise<SuperAdmin> {
    if (!(await this.isSuperAdmin())) throw new Error("unauthorised");
    return new SuperAdmin(this.db, this.id);
  }

  public async toGroupAdmin(groupParams: GroupParams): Promise<GroupAdmin> {
    if (!(await this.isGroupAdminOrBetter(groupParams)))
      throw new Error("unauthorised");
    return new GroupAdmin(this.db, this.id, groupParams);
  }

  public async toSubGroupAdmin(
    subGroupParams: SubGroupParams,
  ): Promise<SubGroupAdmin> {
    if (!(await this.isSubGroupAdminOrBetter(subGroupParams)))
      throw new Error("unauthorised");
    return new SubGroupAdmin(this.db, this.id, subGroupParams);
  }

  public async toStudent(instanceParams: InstanceParams): Promise<Student> {
    if (!(await this.isStudent(instanceParams)))
      throw new Error("unauthorised");

    return new Student(this.db, this.id, instanceParams);
  }

  public async toSupervisor(
    instanceParams: InstanceParams,
  ): Promise<Supervisor> {
    if (!(await this.isSupervisor(instanceParams)))
      throw new Error("User is not a supervisor in this instance");

    return new Supervisor(this.db, this.id, instanceParams);
  }

  public async toReader(instanceParams: InstanceParams): Promise<Reader> {
    if (!(await this.isReader(instanceParams))) throw new Error("unauthorised");

    return new Reader(this.db, this.id, instanceParams);
  }

  public async toMarker(instanceParams: InstanceParams): Promise<Marker> {
    if (!(await this.isMarker(instanceParams))) throw new Error("unauthorised");

    return new Marker(this.db, this.id, instanceParams);
  }

  // --- Other methods
  public async hasSelfDefinedProject(instanceParams: InstanceParams) {
    if (!(await this.isStudent(instanceParams))) return false;

    return await this.toStudent(instanceParams).then((s) =>
      s.hasSelfDefinedProject(),
    );
  }

  public async getManagedGroups(): Promise<GroupDTO[]> {
    const groups = await this.db.allocationGroup.findMany({
      where: { groupAdmins: { some: { userId: this.id } } },
    });

    // TODO: maybe make transformers for this?
    return groups.map(({ displayName, id }) => ({ displayName, group: id }));
  }

  // TODO REVIEW; I fixed the bug but I am not sure if I did it right
  public async getManagedSubGroups(): Promise<SubGroupDTO[]> {
    const subGroups = await this.db.allocationSubGroup.findMany({
      where: {
        OR: [
          { subGroupAdmins: { some: { userId: this.id } } },
          { allocationGroup: { groupAdmins: { some: { userId: this.id } } } },
        ],
      },
    });

    return subGroups.map(({ displayName, allocationGroupId, id }) => ({
      displayName,
      group: allocationGroupId,
      subGroup: id,
    }));
  }

  // TODO: still don't know if this is the best way to do this
  public async getManagedSubGroupsWithGroups(): Promise<
    { group: GroupDTO; subGroup: SubGroupDTO }[]
  > {
    const subGroups = await this.db.allocationSubGroup.findMany({
      where: {
        OR: [
          { subGroupAdmins: { some: { userId: this.id } } },
          { allocationGroup: { groupAdmins: { some: { userId: this.id } } } },
        ],
      },
      include: { allocationGroup: true },
    });

    return subGroups.map(({ displayName, allocationGroup, id }) => ({
      group: {
        displayName: allocationGroup.displayName,
        group: allocationGroup.id,
      },
      subGroup: { displayName, group: allocationGroup.id, subGroup: id },
    }));
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    if (await this.isSuperAdmin()) {
      return await new Institution(this.db).getInstances();
    }

    const instanceData = await this.db.allocationInstance.findMany({
      where: {
        OR: [
          { users: { some: { userId: this.id } } },
          {
            allocationSubGroup: {
              subGroupAdmins: { some: { userId: this.id } },
            },
          },
          {
            allocationSubGroup: {
              allocationGroup: { groupAdmins: { some: { userId: this.id } } },
            },
          },
        ],
      },
    });

    return instanceData.map(T.toAllocationInstanceDTO);
  }

  public async authoriseBreadcrumbs(segments: string[]) {
    const [group, subGroup, instance, staticSegment, id] = segments;
    const res: ValidatedSegments[] = [];

    if (group) {
      res.push({
        segment: group,
        access: await this.isGroupAdminOrBetter({ group }),
      });
    }
    if (group && subGroup) {
      res.push({
        segment: subGroup,
        access: await this.isSubGroupAdminOrBetter({ group, subGroup }),
      });
    }
    if (group && subGroup && instance) {
      res.push({
        segment: instance,
        access: await this.isMember({ group, subGroup, instance }),
      });
    }

    // TODO: this doesn't yet handle users access to the /supervisors/[id] and /students/[id] routes (possibly going to be a new /readers/[id] route)
    // users who don't have access to those pages should still see the breadcrumbs with the correct permissions to be able to navigate back to their allowed pages
    // @pkitazos here's is a skeleton implementation - just needs you to implement the rules for when access is possible
    if (staticSegment) {
      res.push({ segment: staticSegment, access: true });
    }

    if (id) {
      switch (staticSegment) {
        case "projects":
          res.push({ segment: id, access: true });
          break;

        case "students":
          res.push({ segment: id, access: true });
          break;

        case "supervisors":
          res.push({ segment: id, access: true });
          break;

        case "readers":
          res.push({ segment: id, access: true });
          break;

        default:
          res.push({ segment: id, access: true });
          console.error(
            `User.AuthoriseBreadcrumbs: Unknown static segment ${staticSegment}`,
          );
      }
    }

    return res;
  }

  public async joinInstance(params: InstanceParams): Promise<InstanceUserDTO> {
    return await this.db.userInInstance
      .update({
        where: { instanceMembership: { ...expand(params), userId: this.id } },
        data: { joined: true },
        include: { user: true },
      })
      .then(T.toInstanceUserDTO);
  }
}
