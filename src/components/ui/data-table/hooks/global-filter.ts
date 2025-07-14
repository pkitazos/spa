import { useQueryState, parseAsString } from "nuqs";

export function useGlobalFilterSearchParams() {
  return useQueryState("search", parseAsString.withDefault(""));
}
