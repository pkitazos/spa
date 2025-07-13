"use client";

// Jakes super cool and slightly crazy safe URL de-defaulting thing-a-majig.
// I stole a lot of this from JGET's search page (which has lovely behavior)

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { z } from "zod";

export type UrlFactory<T> = (newVals: Partial<T>) => string;

function assimilate<TParams extends Record<string, unknown>>(
  defaults: TParams,
  prev: TParams,
  delta: Partial<TParams>,
): TParams {
  const copy = { ...prev, ...delta };

  for (const [k, v] of Object.entries(defaults)) {
    if (
      copy[k] === v ||
      (Array.isArray(v) && JSON.stringify(v) === JSON.stringify(copy[k]))
    ) {
      delete copy[k];
    }
  }

  return copy;
}

/**
 *
 * @param schema Schema to validate against; make sure this succeeds against `{}`
 *  (i.e. by giving every property a default or optional)
 * @returns `[current, update]` the current search params and an updater method
 */
export function useTypedSearchParams<
  T extends z.ZodType<Record<string, string | number | boolean | string[]>>,
>(schema: T): [z.output<T>, UrlFactory<z.output<T>>] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaults = schema.parse({});

  const fromURL = schema.parse(
    Object.fromEntries(
      searchParams.entries().map(([k, v]) => [k, decodeURIComponent(v)]),
    ),
  );

  const current = { ...defaults, ...fromURL };

  const getURL = useCallback(
    (newVals: Partial<z.output<T>>) => {
      const newParams = assimilate(defaults, current, newVals);
      const res = Object.fromEntries(
        Object.entries(newParams).map(([k, v]) => [
          k,
          //@ts-expect-error It can chew lists, its just dumb
          encodeURIComponent(v),
        ]),
      );
      return `${pathname}?${new URLSearchParams(res).toString()}`;
    },
    [current],
  );

  return [current, getURL];
}
