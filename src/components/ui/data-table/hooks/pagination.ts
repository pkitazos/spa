import { useQueryStates, parseAsIndex, parseAsInteger } from "nuqs";

export function usePaginationSearchParams() {
  return useQueryStates(
    {
      pageIndex: parseAsIndex.withDefault(0),
      pageSize: parseAsInteger.withDefault(10),
    },
    { urlKeys: { pageIndex: "page", pageSize: "page-size" } },
  );
}
