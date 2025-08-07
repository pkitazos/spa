import { z } from "zod";

// move - co-locate with form-sections

export const newAdminSchema = z.object({
  name: z.string("Please enter a valid name").min(2),
  institutionId: z.string("Please enter a valid GUID").min(2),
  email: z.email("Please enter a valid email"),
});

export type NewAdmin = z.infer<typeof newAdminSchema>;
