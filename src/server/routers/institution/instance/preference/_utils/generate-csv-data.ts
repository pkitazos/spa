import { z } from "zod";

import {
  type StudentPreferenceDto,
  type SupervisorCentricPreferenceDto,
  type TagCentricPreferenceDto,
} from "@/lib/validations/dto/preference";

export const csvDataSchema = z.object({
  header: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
});

export function generateProjectAggregated(data: StudentPreferenceDto[]): {
  header: string[];
  rows: (string | number)[][];
} {
  // Aggregate student preferences by project ID, collecting student-rank pairs
  const rowData = data.reduce(
    (acc, p) => {
      const curr = acc[p.projectId] || [];
      acc[p.projectId] = [...curr, [p.userId, p.rank]];
      return acc;
    },
    {} as Record<string, [string, number][]>,
  );

  let maxCount = 0;

  // Transform the aggregated data into rows for CSV export
  const rows = Object.entries(rowData)
    .map(([projectId, rest]) => {
      const count = rest.length;
      maxCount = Math.max(maxCount, count);
      return [projectId, count, ...rest.flat()];
    })
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  // Dynamically construct the CSV header based on the maximum student count
  const header = [
    "Project ID",
    "Count",
    ...Array.from({ length: maxCount }, (_, i) => [
      `Student ${i + 1} ID`,
      `Student ${i + 1} Rank`,
    ]).flat(),
  ];
  return { header, rows };
}

export function generateProjectNormalised(data: StudentPreferenceDto[]) {
  const rows = data.map((p) => [p.projectId, p.userId, p.rank]);

  const header = ["Project ID", "Student ID", "Rank"];

  return { header, rows };
}

export function generateSupervisorAggregated(
  data: SupervisorCentricPreferenceDto[],
): { header: string[]; rows: (string | number)[][] } {
  // Aggregate student preferences by project ID, collecting student-rank pairs
  const rowData = data.reduce(
    (acc, p) => {
      const curr = acc[p.supervisorId] || [];
      acc[p.supervisorId] = [...curr, [p.projectId, p.userId, p.rank]];
      return acc;
    },
    {} as Record<string, [string, string, number][]>,
  );

  let maxCount = 0;

  // Transform the aggregated data into rows for CSV export
  const rows = Object.entries(rowData)
    .map(([supervisorId, rest]) => {
      const count = rest.length;
      maxCount = Math.max(maxCount, count);
      return [supervisorId, count, ...rest.flat()];
    })
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  // Dynamically construct the CSV header based on the maximum student count
  const header = [
    "Supervisor ID",
    "Count",
    ...Array.from({ length: maxCount }, (_, i) => [
      `Project ID`,
      `Student ${i + 1} ID`,
      `Student ${i + 1} Rank`,
    ]).flat(),
  ];

  return { header, rows };
}

export function generateSupervisorNormalised(
  data: SupervisorCentricPreferenceDto[],
): { header: string[]; rows: (string | number)[][] } {
  const rows = data.map((p) => [p.supervisorId, p.projectId, p.userId, p.rank]);

  const header = ["Supervisor ID", "Project ID", "Student ID", "Rank"];

  return { header, rows };
}

export function generateTagAggregated(data: TagCentricPreferenceDto[]) {
  // Aggregate student preferences by project ID, collecting student-rank pairs
  const rowData = data.reduce(
    (acc, p) => {
      const curr = acc[p.tag] || [];
      acc[p.tag] = [...curr, [p.projectId, p.userId, p.rank]];
      return acc;
    },
    {} as Record<string, [string, string, number][]>,
  );

  let maxCount = 0;

  // Transform the aggregated data into rows for CSV export
  const rows = Object.entries(rowData)
    .map(([tag, rest]) => {
      const count = rest.length;
      maxCount = Math.max(maxCount, count);
      return [tag, count, ...rest.flat()];
    })
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  // Dynamically construct the CSV header based on the maximum student count
  const header = [
    "Tag",
    "Count",
    ...Array.from({ length: maxCount }, (_, i) => [
      `Project ID`,
      `Student ${i + 1} ID`,
      `Student ${i + 1} Rank`,
    ]).flat(),
  ];

  return { header, rows };
}

export function generateTagNormalised(data: TagCentricPreferenceDto[]) {
  const rows = data.map((p) => [p.tag, p.projectId, p.userId, p.rank]);

  const header = ["Tag", "Project ID", "Student ID", "Rank"];

  return { header, rows };
}
