"use client";

import { ProjectDTO, StudentDTO, UnitOfAssessmentDTO } from "@/dto";
import { MarkingSubmissionStatus } from "@/dto/result/marking-submission-status";
import { MarkerType } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";

export type SubmissionTableRow = {
  project: ProjectDTO;
  student: StudentDTO;
  markerType: MarkerType;
  unitsOfAssessment: {
    unit: UnitOfAssessmentDTO;
    status: MarkingSubmissionStatus;
  }[];
};

export const columns: ColumnDef<SubmissionTableRow>[] = [
  { id: "projectTitle", accessorKey: "project.title", header: "Project" },
  { id: "role", accessorKey: "markerType", header: "Role" },
];
