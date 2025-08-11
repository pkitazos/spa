import { type FilterFn } from "@tanstack/react-table";
import { z } from "zod";

import { type ProjectSearchColumn } from "./project-search-columns";

export const globalContains: FilterFn<ProjectSearchColumn> = (
  row,
  columnId,
  filterValue,
) => {
  const target = String(row.getValue(columnId) ?? "").toLowerCase();
  const query = String(filterValue ?? "").toLowerCase();
  return target.includes(query);
};

export const hasSome: FilterFn<ProjectSearchColumn> = (
  row,
  columnId,
  filterValue,
) => {
  const rowValue = row.getValue<string>(columnId);
  const filters = z.string().array().parse(filterValue);
  return filters.includes(rowValue);
};
