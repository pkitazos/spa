import { Transformers as T } from "@/db/transformers";
import { DB } from "@/db/types";
import { GroupDTO, SuperAdminDTO, InstanceDTO, UserDTO } from "@/dto";
import { slugify } from "@/lib/utils/general/slugify";
import { DataObject } from "../data-object";

export class Institution extends DataObject {
  constructor(db: DB) {
    super(db);
  }

  // WARNING bug see group.createSubroup
  public async createGroup(displayName: string): Promise<GroupDTO> {
    return await this.db.allocationGroup
      .create({ data: { id: slugify(displayName), displayName } })
      .then(T.toAllocationGroupDTO);
  }

  public async getAdmins(): Promise<SuperAdminDTO[]> {
    const admins = await this.db.superAdmin.findMany({
      select: { user: true },
    });

    return admins.map(({ user }) => user);
  }

  public async getGroups(): Promise<GroupDTO[]> {
    const groups = await this.db.allocationGroup.findMany();

    return groups.map(T.toAllocationGroupDTO);
  }

  public async getInstances(): Promise<InstanceDTO[]> {
    const instances = await this.db.allocationInstance.findMany();
    return instances.map(T.toAllocationInstanceDTO);
  }

  public async createUser(data: UserDTO): Promise<void> {
    this.db.user.create({ data });
  }

  public async createUsers(users: UserDTO[]): Promise<void> {
    this.db.user.createMany({ data: users, skipDuplicates: true });
  }

  public async userExists(id: string): Promise<boolean> {
    return !!(await this.db.user.findFirst({ where: { id } }));
  }

  public async getUsers(): Promise<UserDTO[]> {
    return await this.db.user.findMany();
  }
}
