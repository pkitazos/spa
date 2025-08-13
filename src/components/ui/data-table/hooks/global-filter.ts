import { useQueryState, parseAsString } from "nuqs";

import { addPrefix } from "./add-prefix";

export function useGlobalFilterSearchParams(prefix?: string) {
  return useQueryState(
    addPrefix("search", prefix),
    parseAsString.withDefault(""),
  );
}
