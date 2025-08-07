import { PAGES } from "@/config/pages";

import {
  type UserDTO,
  type InstanceDTO,
  type InstanceUserDTO,
  type GroupDTO,
  type SubGroupDTO,
} from "@/dto";

import { Transformers as T } from "@/db/transformers";
import { type DB, Role } from "@/db/types";

import { expand } from "@/lib/utils/general/instance-params";
import {
  type GroupParams,
  type SubGroupParams,
  type InstanceParams,
} from "@/lib/validations/params";

import { DataObject } from "../data-object";
import { Institution } from "../space/institution";

import { UrlSegment } from "..";

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

  public async create(user: UserDTO): Promise<UserDTO> {
    return await this.db.user.create({ data: T.toUserDTO(user) });
  }

  public async toMaybeDTO(): Promise<UserDTO | undefined> {
    this._data ??=
      (await this.db.user.findFirst({ where: { id: this.id } })) ?? undefined;
    return this._data;
  }

  public async toDTO(): Promise<UserDTO> {
    this._data ??= await this.db.user.findFirstOrThrow({
      where: { id: this.id },
    });
    return this._data;
  }

  static fromDTO(db: DB, data: UserDTO): User {
    const user = new User(db, data.id);
    user._data = data;
    return user;
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

    return groups.map((x) => T.toGroupDTO(x));
  }

  public async getManagedSubGroups(): Promise<SubGroupDTO[]> {
    const subGroups = await this.db.allocationSubGroup.findMany({
      where: {
        OR: [
          { subGroupAdmins: { some: { userId: this.id } } },
          { allocationGroup: { groupAdmins: { some: { userId: this.id } } } },
        ],
      },
    });

    return subGroups.map((x) => T.toSubGroupDTO(x));
  }

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

    return subGroups.map((subGroup) => ({
      group: T.toGroupDTO(subGroup.allocationGroup),
      subGroup: T.toSubGroupDTO(subGroup),
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

    return instanceData.map((x) => T.toAllocationInstanceDTO(x));
  }

  public async authoriseBreadcrumbs(
    segments: string[],
  ): Promise<{ segment: string; access: boolean }[]> {
    const [group, subGroup, instance, staticSegment, id, modifier] = segments;
    const res: { segment: string; access: boolean }[] = [];

    const addSegment = (segment: string | undefined, access: boolean) => {
      if (segment && typeof segment === "string") {
        res.push({ segment, access });
      }
    };

    if (group === PAGES.me.href) {
      addSegment(group, true);
      if (subGroup) throw new Error("Unknown Segment");
      return res;
    }

    if (group === PAGES.superAdminPanel.href) {
      const isSuperAdmin = await this.isSuperAdmin();
      addSegment(group, isSuperAdmin);

      if (
        subGroup === PAGES.newGroup.href ||
        subGroup === PAGES.userManagement.href
      ) {
        addSegment(subGroup, isSuperAdmin);
      } else if (subGroup) throw new Error("Unknown Segment");

      return res;
    }

    if (group) {
      addSegment(group, await this.isGroupAdminOrBetter({ group }));

      if (subGroup === PAGES.newSubGroup.href) {
        addSegment(subGroup, await this.isGroupAdminOrBetter({ group }));

        if (instance) throw new Error("Unknown Segment");
        return res;
      }
    }

    if (group && subGroup) {
      addSegment(
        subGroup,
        await this.isSubGroupAdminOrBetter({ group, subGroup }),
      );

      if (instance === PAGES.newInstance.href) {
        addSegment(
          instance,
          await this.isSubGroupAdminOrBetter({ group, subGroup }),
        );

        if (staticSegment) throw new Error("Unknown Segment");
        return res;
      }
    }

    if (group && subGroup && instance) {
      addSegment(instance, await this.isMember({ group, subGroup, instance }));
    }

    if (staticSegment) {
      if (!UrlSegment.isStaticValid(staticSegment)) {
        addSegment(staticSegment, false);
        addSegment(id, false);
        return res;
      }

      const segmentRoles = UrlSegment.getSegmentRoles(staticSegment);
      const userRoles = await this.getRolesInInstance({
        group,
        subGroup,
        instance,
      });

      const staticSegmentAccess = userRoles.intersection(segmentRoles).size > 0;

      addSegment(staticSegment, staticSegmentAccess);

      if (id && UrlSegment.hasSubRoute(staticSegment)) {
        addSegment(id, staticSegmentAccess);
      } else if (id && !UrlSegment.hasSubRoute(staticSegment)) {
        throw new Error("Unknown Segment");
      }
      const allowedModifiers: Record<string, string> = {
        [PAGES.allSupervisors.href]: PAGES.newSupervisorProject.href,
        [PAGES.allStudents.href]: PAGES.studentPreferences.href,
        [PAGES.allProjects.href]: PAGES.editProject.href,
      };

      if (allowedModifiers[staticSegment] === modifier) {
        addSegment(modifier, staticSegmentAccess);
      } else if (modifier) {
        throw new Error("Unknown Segment");
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
      .then((x) => T.toInstanceUserDTO(x));
  }
}
