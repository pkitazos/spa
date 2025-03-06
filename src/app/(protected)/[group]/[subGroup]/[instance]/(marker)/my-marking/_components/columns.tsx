"use client"

import type { ColumnDef } from "@tanstack/react-table"

export type Submission = {
  id: string
  title: string
  dueDate?: string
  status: "mark" | "edit" | "submitted" | "not_open"
}

export type Project = {
  id: string
  type: "project"
  projectName: string
  studentName: string
  role: string
  submissions: Submission[]
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "projectName",
    header: "Project",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
]

