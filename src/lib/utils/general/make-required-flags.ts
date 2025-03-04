import { projectFlags } from "@/config/config/flags";

/**
 * @deprecated
 */
export function makeRequiredFlags(flags: string[]) {
  return [projectFlags.level4, projectFlags.level5].every((title) =>
    flags.includes(title),
  )
    ? [projectFlags.level4, projectFlags.level5]
    : [];
}
