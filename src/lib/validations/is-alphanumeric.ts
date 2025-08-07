import { z } from "zod";

export const isAlphanumeric = (
  errMsg = "Only alphanumeric characters are allowed",
) => z.string().regex(/^[a-zA-Z0-9]+$/, errMsg);
