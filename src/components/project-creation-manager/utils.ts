import { type FilterFn } from "@tanstack/react-table";
import { z } from "zod";

import { spacesLabels } from "@/config/spaces";

import { isSameInstance } from "@/lib/utils/general/instance-params";
import { nubsById } from "@/lib/utils/list-unique";
import type { InstanceParams } from "@/lib/validations/params";

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

export const makeFilters = (
  params: InstanceParams,
  previousProjectData: ProjectSearchData[],
) => [
  {
    columnId: "instance",
    title: spacesLabels.instance.short,
    options: previousProjectData
      .map((row) => ({
        id: row.instanceData.displayName,
        displayName: row.instanceData.displayName,
      }))
      .filter(nubsById),
  },
  {
    columnId: "Flags",
    title: "filter by Flags",
    options: previousProjectData
      .filter((p) => isSameInstance(params, p.instanceData))
      .flatMap((p) => p.project.flags)
      .filter(nubsById),
  },
  {
    columnId: "Keywords",
    title: "filter by Keywords",
    options: previousProjectData
      .filter((p) => isSameInstance(params, p.instanceData))
      .flatMap((p) =>
        p.project.tags.map((tag) => ({ id: tag.id, displayName: tag.title })),
      )
      .filter(nubsById),
  },
];
