"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { Grade } from "@/config/grades";

import { cn } from "@/lib/utils";

import { type ProjectMarkingOverview, type UnitGradingStatus } from "./row";

export const columns: ColumnDef<ProjectMarkingOverview>[] = [
  { id: "chevron" },
  {
    id: "project-title",
    header: "Project Title",
    accessorFn: (x) => x.project.title,
  },
  {
    id: "student-flag",
    header: "Flag",
    accessorFn: (x) => x.student.flag.displayName,
  },
  {
    id: "student-name",
    header: "Student Name",
    accessorFn: (x) => x.student.name,
  },
  { id: "status", header: "Status", accessorFn: (x) => x.status.status },
];

export function StatusBox({ status }: { status: UnitGradingStatus }) {
  const universalStyles =
    "py-2text-sm inline-flex h-10 items-center justify-center rounded-md px-4 font-medium";

  if (status.status === "PENDING")
    return (
      <div className={cn(universalStyles, "bg-accent text-accent-foreground")}>
        Pending
      </div>
    );
  if (status.status === "NEGOTIATION")
    return (
      <div className={cn(universalStyles, "bg-accent text-accent-foreground")}>
        In Negotiation
      </div>
    );
  if (status.status === "MODERATION")
    return (
      <div
        className={cn(
          universalStyles,
          "bg-destructive text-destructive-foreground",
        )}
      >
        In Moderation
      </div>
    );

  //   status.status === "MARKED"
  return (
    <div className={cn(universalStyles, "bg-primary text-primary-foreground")}>
      Marked{" "}
      <span className="ml-2 rounded-md bg-accent px-1 text-accent-foreground">
        {Grade.toLetter(status.grade)}
      </span>
    </div>
  );
}
