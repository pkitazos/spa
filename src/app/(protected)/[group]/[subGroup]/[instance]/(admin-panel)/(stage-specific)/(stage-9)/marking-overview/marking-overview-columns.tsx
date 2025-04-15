"use client";

import { ColumnDef } from "@tanstack/react-table";
import { GradingStatus, MarkingOverviewRow, UnitGradingStatus } from "./row";

export const columns: ColumnDef<MarkingOverviewRow>[] = [
  { id: "project-title", accessorFn: (x) => x.project.project.title },
  { id: "student-name", accessorFn: (x) => x.project.student.name },
  { id: "student-matric", accessorFn: (x) => x.project.student.id },
  { id: "student-level", accessorFn: (x) => x.project.student.level },
  { id: "unit-id", accessorFn: (x) => x.unit.unit.id },
  {
    id: "status",
    accessorFn: (x) => x.marker.status,
    cell: (cell) => <StatusBox status={cell.getValue<GradingStatus>()} />,
  },
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
