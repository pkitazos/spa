import { z } from "zod";

import { INSTITUTION } from "@/config/institution";

export const institutionIdSchema = z.coerce
  .string<string>(`Please enter a valid ${INSTITUTION.ID_NAME}`)
  .min(1, `Please enter a valid ${INSTITUTION.ID_NAME}`)
  .regex(
    /^[a-zA-Z0-9]+$/,
    `Only alphanumeric characters are allowed in ${INSTITUTION.ID_NAME}`,
  );
