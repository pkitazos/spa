import { type FilterFn } from "@tanstack/react-table";
import { z } from "zod";

import { type ProjectSearchData } from ".";

export const globalContains: FilterFn<ProjectSearchData> = (
  row,
  columnId,
  filterValue,
) => {
  const target = String(row.getValue(columnId) ?? "").toLowerCase();
  const query = String(filterValue ?? "").toLowerCase();
  return target.includes(query);
};

export const hasSome: FilterFn<ProjectSearchData> = (
  row,
  columnId,
  filterValue,
) => {
  const rowValue = row.getValue<string>(columnId);
  const filters = z.string().array().parse(filterValue);
  return filters.includes(rowValue);
};
