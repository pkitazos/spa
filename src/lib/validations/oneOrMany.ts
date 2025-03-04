import { z } from "zod";

export function oneOrMany<P>(x: z.Schema<P>) {
  return z.array(x).or(x.transform((x) => [x]));
}
