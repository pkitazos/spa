"use client";

import { ExportCSVButton } from "@/components/export-csv";
import { Button } from "@/components/ui/button";

import { type AllocationCsvData } from "@/lib/validations/allocation-csv-data";

export function ExportDataButton({ data }: { data: AllocationCsvData[] }) {
  const header = [
    "Project ID",
    "Student GUID",
    "Student Name",
    "Student Matric.",
    "Student Email",
    "Student Flag",
    "Project Title",
    "Project Description",
    "Student Ranking",
    "Supervisor GUID",
    "Supervisor Name",
    "Supervisor Email",
  ];

  const exportData = data.map((e) => [
    e.project.id,
    e.student.id,
    e.student.name,
    e.student.matric,
    e.student.email,
    e.student.flag.displayName,
    e.project.title,
    e.project.description,
    e.student.ranking,
    e.supervisor.id,
    e.supervisor.name,
    e.supervisor.email,
  ]);

  return (
    <Button variant="outline">
      <ExportCSVButton
        text="Export Data to CSV"
        filename="project_allocation_data"
        header={header}
        data={exportData}
      />
    </Button>
  );
}
