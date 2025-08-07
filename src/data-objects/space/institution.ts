import {
  type GroupDTO,
  type SuperAdminDTO,
  type InstanceDTO,
  type UserDTO,
} from "@/dto";

import { Transformers as T } from "@/db/transformers";
import { type DB } from "@/db/types";

import { toInstanceId } from "@/lib/utils/general/instance-params";
import { slugify } from "@/lib/utils/general/slugify";
import { type InstanceParams } from "@/lib/validations/params";

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

  public async instanceExists(params: InstanceParams): Promise<boolean> {
    return !!(await this.db.allocationInstance.findFirst({
      where: toInstanceId(params),
    }));
  }

  public async createUser({ id, name, email }: UserDTO): Promise<UserDTO> {
    return await this.db.user.create({ data: { id, name, email } });
  }

  public async getUserById(userId: string): Promise<UserDTO> {
    return await this.db.user.findFirstOrThrow({ where: { id: userId } });
  }

  public async updateUser({ id, name, email }: UserDTO): Promise<UserDTO> {
    return await this.db.user.update({ where: { id }, data: { name, email } });
  }

  public async createUsers(users: UserDTO[]): Promise<void> {
    await this.db.user.createMany({ data: users, skipDuplicates: true });
  }

  public async userExists(id: string): Promise<boolean> {
    return !!(await this.db.user.findFirst({ where: { id } }));
  }

  public async getUsers(): Promise<UserDTO[]> {
    return await this.db.user.findMany();
  }

  public async deleteUser(id: string): Promise<UserDTO> {
    return await this.db.user.delete({ where: { id } });
  }
}
