"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  MoreHorizontalIcon as MoreIcon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type StudentDTO } from "@/dto/user";

import { type ExtendedPreferenceType, PreferenceType } from "@/db/types";

import { useInstancePath } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ActionColumnLabel } from "@/components/ui/data-table/action-column-label";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

type StudentPreferenceData = {
  student: StudentDTO;
  preference: { type: ExtendedPreferenceType; rank?: number };
};

export function useStudentPreferenceColumns(): ColumnDef<StudentPreferenceData>[] {
  const instancePath = useInstancePath();

  const columns: ColumnDef<StudentPreferenceData>[] = [
    {
      id: INSTITUTION.ID_NAME,
      accessorFn: ({ student }) => student.id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={INSTITUTION.ID_NAME} />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <WithTooltip
          align="start"
          tip={<div className="max-w-xs">{student.id}</div>}
        >
          <div className="w-40 truncate">{student.id}</div>
        </WithTooltip>
      ),
    },
    {
      id: "Name",
      accessorFn: ({ student }) => student.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={`${instancePath}/${PAGES.allStudents.href}/${student.id}`}
        >
          {student.name}
        </Link>
      ),
    },
    {
      id: "Flag",
      accessorFn: ({ student }) => student.flag.displayName,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-20" column={column} title="Flag" />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <div className="grid w-20 place-items-center">
          <Badge variant="accent" className="rounded-md">
            {student.flag.displayName}
          </Badge>
        </div>
      ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = z.array(z.string()).parse(value);
        return selectedFilters.includes(row.getValue<string>(columnId));
      },
    },
    {
      id: "Type",
      accessorFn: ({ preference }) => preference.type,
      header: ({ column }) => (
        <DataTableColumnHeader title="Type" column={column} />
      ),
      cell: ({
        row: {
          original: { preference },
        },
      }) => {
        return preference.type === PreferenceType.PREFERENCE ? (
          <Badge className="bg-primary text-center font-semibold">
            Preference
          </Badge>
        ) : (
          <Badge className="bg-secondary text-center font-semibold">
            Shortlist
          </Badge>
        );
      },
    },
    {
      id: "Rank",
      accessorFn: ({ preference }) => preference.rank,
      header: ({ column }) => (
        <DataTableColumnHeader title="Rank" column={column} />
      ),
      cell: ({
        row: {
          original: { preference },
        },
      }) => (
        <div className="text-center font-semibold">
          {Number.isNaN(preference.rank) ? "-" : preference.rank}
        </div>
      ),
    },
    {
      accessorKey: "actions",
      id: "Actions",
      header: () => <ActionColumnLabel className="w-24" />,
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <div className="flex w-24 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-68" align="center" side="bottom">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`${instancePath}/student/${student.id}`}
                >
                  <CornerDownRightIcon className="h-4 w-4" />
                  <span>View Student details</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return columns;
}
