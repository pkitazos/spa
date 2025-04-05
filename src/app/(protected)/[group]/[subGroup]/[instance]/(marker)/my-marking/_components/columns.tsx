"use client";

import { ProjectDTO, StudentDTO, UnitOfAssessmentDTO } from "@/dto";
import { MarkerType } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";

export type Submission = {
  id: string;
  title: string;
  dueDate?: string;
  status: "mark" | "edit" | "submitted" | "not_open";
};

export type SubmissionTableRow = {
  project: ProjectDTO;
  student: StudentDTO;
  markerType: MarkerType;
  unitsOfAssessment: {
    unit: UnitOfAssessmentDTO;
    isSaved: boolean;
    isSubmitted: boolean;
  }[];
};

export const columns: ColumnDef<SubmissionTableRow>[] = [
  { accessorKey: "projectName", header: "Project" },
  { accessorKey: "role", header: "Role" },
];
