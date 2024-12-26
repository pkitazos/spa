import { AdminLevel } from "@prisma/client";

import { adminLevelOrd } from "@/db";

export function permissionCheck(level: AdminLevel, minimumLevel: AdminLevel) {
  return adminLevelOrd[level] >= adminLevelOrd[minimumLevel];
}
