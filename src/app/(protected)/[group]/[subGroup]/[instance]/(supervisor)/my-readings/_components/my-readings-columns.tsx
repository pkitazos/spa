import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { useInstancePath } from "@/components/params-context";
import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";

export type ReaderProjectData = {
  id: string;
  title: string;
  description: string;
  studentId: string;
};

export function useMyReadingsColumns(): ColumnDef<ReaderProjectData>[] {
  const instancePath = useInstancePath();

  const userCols: ColumnDef<ReaderProjectData>[] = [
    {
      id: "Project Title",
      accessorFn: ({ title }) => title,
      header: () => (
        <div className="min-w-60 max-w-60 py-1 pl-4">Project Title</div>
      ),
      cell: ({
        row: {
          original: { id, title },
        },
      }) => (
        <WithTooltip tip={<p className="max-w-96">{title}</p>}>
          {
            <Link
              className={cn(
                buttonVariants({ variant: "link" }),
                "inline-block w-60 truncate px-0 text-start",
              )}
              href={`${instancePath}/projects/${id}`}
            >
              {title}
            </Link>
          }
        </WithTooltip>
      ),
    },
    {
      id: "Description",
      accessorFn: ({ description }) => description,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-36"
          column={column}
          title="Description"
        />
      ),
      cell: ({
        row: {
          original: { description },
        },
      }) => <div className="w-50 py-1 pl-2">{description}</div>,
    },
    {
      id: "Student ID",
      accessorFn: ({ studentId }) => studentId,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-36"
          column={column}
          title="Student ID"
        />
      ),
      cell: ({
        row: {
          original: { studentId },
        },
      }) => <div className="w-50 py-1 pl-2">{studentId}</div>,
    },
  ];

  return userCols;
}
