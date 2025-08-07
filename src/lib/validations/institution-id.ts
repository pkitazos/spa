import { z } from "zod";

import { INSTITUTION } from "@/config/institution";

import { isAlphanumeric } from "./is-alphanumeric";

export const institutionIdSchema = z.coerce
  .string<string>(`Please enter a valid ${INSTITUTION.ID_NAME}`)
  .min(1, `Please enter a valid ${INSTITUTION.ID_NAME}`)
  .pipe(
    isAlphanumeric(
      `Only alphanumeric characters are allowed in ${INSTITUTION.ID_NAME}`,
    ),
  );
