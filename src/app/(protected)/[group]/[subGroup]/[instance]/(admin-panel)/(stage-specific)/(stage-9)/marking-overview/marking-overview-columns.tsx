"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ProjectMarkingOverview, UnitGradingStatus } from "./row";

export const columns: ColumnDef<ProjectMarkingOverview>[] = [
  { id: "chevron" },
  {
    id: "project-title",
    header: "Project Title",
    accessorFn: (x) => x.project.title,
  },
  { id: "student-level", header: "Level", accessorFn: (x) => x.student.level },
  {
    id: "student-name",
    header: "Student Name",
    accessorFn: (x) => x.student.name,
  },
  { id: "status", header: "Status", accessorFn: (x) => x.status.status },
];

export function StatusBox({ status }: { status: UnitGradingStatus }) {
  if (status.status === "PENDING") return <div>Pending</div>;
  if (status.status === "NEGOTIATION") return <div>In Negotiation</div>;
  if (status.status === "MODERATION") return <div>In Moderation</div>;

  //   status.status === "MARKED"
  return (
    <div>
      z Marked <span>{status.grade}</span>
    </div>
  );
}
