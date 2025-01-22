import { projectFlags } from "@/content/config/flags";

/**
 *
 * @deprecated student level does not map to flags anymore
 */
export function getStudentLevelFromFlag<T extends { title: string }>(item: T) {
  if (item.title === projectFlags.level4) return 4;
  if (item.title === projectFlags.level5) return 5;
  return -1;
}

/**
 *
 * @deprecated student flags should now be obtained from the database
 */
export function getFlagFromStudentLevel(level: number) {
  if (level === 4) return projectFlags.level4;
  if (level === 5) return projectFlags.level5;
  throw new Error(`Invalid student level: ${level}`);
}
