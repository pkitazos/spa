"use client";

import type { ColumnDef } from "@tanstack/react-table";

import {
  type ProjectDTO,
  type StudentDTO,
  type UnitOfAssessmentDTO,
} from "@/dto";
import { type MarkingSubmissionStatus } from "@/dto/result/marking-submission-status";

import { type MarkerType } from "@/db/types";

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
