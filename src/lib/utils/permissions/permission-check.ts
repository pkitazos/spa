import { AdminLevel, adminLevelOrd } from "@/db/types";

export function permissionCheck(level: AdminLevel, minimumLevel: AdminLevel) {
  return adminLevelOrd[level] >= adminLevelOrd[minimumLevel];
}
