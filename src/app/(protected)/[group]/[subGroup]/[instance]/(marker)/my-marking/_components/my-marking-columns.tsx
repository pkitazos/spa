import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { useInstancePath } from "@/components/params-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";

export type MarkingProjectData = {
  id: string;
  title: string;
  studentId: string;
  isMarked: boolean;
};

export function useMyMarkingColumns(): ColumnDef<MarkingProjectData>[] {
  const instancePath = useInstancePath();

  const userCols: ColumnDef<MarkingProjectData>[] = [
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
                "w-100 inline-block truncate px-0 text-start",
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
    {
      id: "Mark",
      accessorFn: (isMarked) => isMarked,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-36" column={column} title="Mark" />
      ),
      cell: ({
        row: {
          original: { isMarked, id },
        },
      }) => (
        <div className="w-50 py-1 pl-2">
          {isMarked ? (
            <Button disabled>Marks Submitted</Button>
          ) : (
            <Button>
              <Link href={`${instancePath}/my-marking/${id}`}>Edit Marks</Link>
              <ChevronRight />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return userCols;
}
