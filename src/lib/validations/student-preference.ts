import { z } from "zod";

import { PreferenceType } from "@/db/types";

export const studentPreferenceSchema = z
  .nativeEnum(PreferenceType)
  .or(z.literal("None"));

export type StudentPreferenceType = z.infer<typeof studentPreferenceSchema>;
