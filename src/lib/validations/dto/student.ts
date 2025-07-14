import { z } from "zod";

export const studentInviteDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  level: z.number(),
  joined: z.boolean(),
});

export type StudentInviteDto = z.infer<typeof studentInviteDtoSchema>;

export const studentInstanceDetailsSchema = z.object({
  level: z.coerce
    .number("Please enter a valid integer for the level")
    .int("Please enter a valid integer for the level")
    .refine((level) => level === 4 || level === 5, "Level must be 4 or 5"),
});

export type StudentInstanceDetails = z.infer<
  typeof studentInstanceDetailsSchema
>;

export interface StudentDto {
  id: string;
  name: string;
  email: string;
  level: number;
  projectAllocation?: { id: string; title: string };
}
