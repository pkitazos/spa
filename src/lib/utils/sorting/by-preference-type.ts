import { PreferenceType } from "@prisma/client";

export function sortPreferenceType<T extends { type: PreferenceType }>(
  a: T,
  b: T,
) {
  const aPref = a.type === PreferenceType.PREFERENCE ? 0 : 1;
  const bPref = b.type === PreferenceType.PREFERENCE ? 0 : 1;
  return aPref - bPref;
}
