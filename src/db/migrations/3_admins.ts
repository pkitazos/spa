import { AdminLevel, DB } from "../types";
import adminData from "./data/AdminInSpace.json";

export async function admins(db: DB) {
  const superAdmins = adminData
    .filter((x) => x.admin_level === AdminLevel.SUPER)
    .map((x) => ({ userId: x.user_id }));

  const groupAdmins = adminData
    .filter((x) => x.admin_level === AdminLevel.GROUP)
    .filter((x) => x.allocation_group_id !== null)
    .map((x) => ({
      allocationGroupId: x.allocation_group_id,
      userId: x.user_id,
    }));

  const sgAdmins = adminData
    .filter((x) => x.admin_level === AdminLevel.SUB_GROUP)
    .filter((x) => x.allocation_group_id !== null)
    .filter((x) => x.allocation_sub_group_id !== null)
    .map((x) => ({
      allocationGroupId: x.allocation_group_id,
      allocationSubGroupId: x.allocation_sub_group_id!,
      userId: x.user_id,
    }));

  await db.$transaction([
    db.superAdmin.createMany({ data: superAdmins, skipDuplicates: true }),

    db.groupAdmin.createMany({ data: groupAdmins, skipDuplicates: true }),

    db.subGroupAdmin.createMany({ data: sgAdmins, skipDuplicates: true }),
  ]);
}
