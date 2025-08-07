import { z } from "zod";

import { PreferenceType } from "@/db/types";

export type Id = string;

export const projectPreferenceCardDtoSchema = z.object({
  id: z.string(),
  columnId: z.enum(PreferenceType),
  title: z.string(),
  rank: z.number(),
  supervisor: z.object({ id: z.string(), name: z.string() }),
});

export type ProjectPreferenceCardDto = {
  id: Id;
  columnId: PreferenceType;
  title: string;
  rank: number;
  supervisor: { id: string; name: string };
};

export type PreferenceBoard = Record<
  PreferenceType,
  ProjectPreferenceCardDto[]
>;

export const PREFERENCE_BOARD_COLUMNS = [
  { id: PreferenceType.PREFERENCE, displayName: "Preference List" },
  { id: PreferenceType.SHORTLIST, displayName: "Shortlist" },
];

export const PROJECT_PREFERENCE_CARD = "PROJECT_PREFERENCE_CARD";

export const PROJECT_PREFERENCE_COLUMN = "PROJECT_PREFERENCE_COLUMN";
