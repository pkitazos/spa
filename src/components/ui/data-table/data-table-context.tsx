"use client";

import { createContext, type ReactNode, useContext } from "react";

import { type Flag, type Tag } from "@prisma/client";

const DataTableCtx = createContext<Details | undefined>(undefined);

type Details = {
  flags: Pick<Flag, "id" | "title">[];
  tags: Pick<Tag, "id" | "title">[];
};

export function DataTableProvider({
  children,
  details,
}: {
  children: ReactNode;
  details: Details;
}) {
  return (
    <DataTableCtx.Provider value={details}>{children}</DataTableCtx.Provider>
  );
}

export function useDataTableFlags() {
  const details = useContext(DataTableCtx);
  if (!details) throw new Error("Missing DataTableProvider in the tree");
  return details.flags;
}
export function useDataTableTags() {
  const details = useContext(DataTableCtx);
  if (!details) throw new Error("Missing DataTableProvider in the tree");
  return details.tags;
}

export function useDataTableProjectFilters() {
  const flags = useDataTableFlags();
  const tags = useDataTableTags();
  return [
    { columnId: "Flags", options: flags },
    { columnId: "Keywords", options: tags },
  ];
}

export const studentLevelFilter = {
  title: "Student Level",
  columnId: "Level",
  options: [
    { id: "4", title: "Level 4" },
    { id: "5", title: "Level 5" },
  ],
};
