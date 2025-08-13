import { useQueryStates, parseAsIndex, parseAsInteger } from "nuqs";

import { addPrefix } from "./add-prefix";

export function usePaginationSearchParams(prefix?: string) {
  return useQueryStates(
    {
      pageIndex: parseAsIndex.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
    },
    {
      urlKeys: {
        pageIndex: addPrefix("page", prefix),
        pageSize: addPrefix("page-size", prefix),
      },
    },
  );
}
