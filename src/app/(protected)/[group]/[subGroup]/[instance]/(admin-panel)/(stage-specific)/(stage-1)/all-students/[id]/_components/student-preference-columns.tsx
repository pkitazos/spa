"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  BookmarkIcon,
  CornerDownRightIcon,
  MoreHorizontalIcon as MoreIcon,
} from "lucide-react";
import Link from "next/link";

import { PAGES } from "@/config/pages";

import { PreferenceType, Stage } from "@/db/types";

import { ConditionalRender } from "@/components/access-control";
import { FormatDenials } from "@/components/access-control/format-denial";
import { useInstanceStage } from "@/components/params-context";
import { StudentPreferenceActionSubMenu } from "@/components/student-preference-action-menu";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ActionColumnLabel } from "@/components/ui/data-table/action-column-label";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { getSelectColumn } from "@/components/ui/data-table/select-column";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { previousStages, stageLt } from "@/lib/utils/permissions/stage-check";
import { type StudentPreferenceType } from "@/lib/validations/student-preference";

export type PreferenceData = {
  project: { id: string; title: string };
  supervisor: { name: string; id: string };
  type: PreferenceType;
  rank: number;
};

export function useStudentPreferencesColumns({
  changePreference,
  changeMultiplePreferences,
}: {
  changePreference: (
    newType: StudentPreferenceType,
    id: string,
  ) => Promise<void>;
  changeMultiplePreferences: (
    newType: StudentPreferenceType,
    ids: string[],
  ) => Promise<void>;
}): ColumnDef<PreferenceData>[] {
  const stage = useInstanceStage();
  const selectCol = getSelectColumn<PreferenceData>();

  const userCols: ColumnDef<PreferenceData>[] = [
    {
      id: "ID",
      accessorFn: ({ project }) => project.id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({
        row: {
          original: { project },
        },
      }) => (
        <div className="text-left">
          <WithTooltip tip={project.id}>
            <Button variant="ghost" className="cursor-default">
              <div className="w-20 truncate">{project.id}</div>
            </Button>
          </WithTooltip>
        </div>
      ),
    },
    {
      id: "Title",
      accessorFn: ({ project }) => project.title,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({
        row: {
          original: { project },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={`../projects/${project.id}`}
        >
          {project.title}
        </Link>
      ),
    },
    {
      id: "Supervisor",
      accessorFn: ({ supervisor }) => supervisor.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Supervisor" />
      ),
      cell: ({
        row: {
          original: {
            supervisor: { id, name },
          },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={`../${PAGES.allSupervisors.href}/${id}`}
        >
          {name}
        </Link>
      ),
    },
    {
      id: "Type",
      accessorFn: ({ type }) => type,
      header: ({ column }) => (
        <DataTableColumnHeader title="Type" column={column} />
      ),
      cell: ({
        row: {
          original: { type },
        },
      }) => {
        return type === PreferenceType.PREFERENCE ? (
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
      accessorFn: ({ rank }) => rank,
      header: ({ column }) => (
        <DataTableColumnHeader title="Rank" column={column} />
      ),
      cell: ({
        row: {
          original: { rank },
        },
      }) => (
        <div className="text-center font-semibold">
          {Number.isNaN(rank) ? "-" : rank}
        </div>
      ),
    },
  ];

  const actionsCol: ColumnDef<PreferenceData> = {
    accessorKey: "actions",
    id: "Actions",
    header: ({ table }) => {
      const someSelected =
        table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

      const selectedProjectIds = table
        .getSelectedRowModel()
        .rows.map((e) => e.original.project.id);

      const rowTypes = table.getRowModel().rows.map((r) => r.original.type);
      const defaultType = rowTypes.reduce(
        (acc, val) => (acc === val ? acc : undefined),
        rowTypes.at(0),
      );

      async function handleSelectedPreferenceChange(
        newPreferenceType: StudentPreferenceType,
      ) {
        void changeMultiplePreferences(
          newPreferenceType,
          selectedProjectIds,
        ).then(() => {
          table.toggleAllRowsSelected(false);
        });
      }

      if (someSelected && stageLt(stage, Stage.PROJECT_ALLOCATION)) {
        return (
          <div className="flex w-full items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-68"
                align="center"
                side="bottom"
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <StudentPreferenceActionSubMenu
                  defaultType={defaultType}
                  changePreference={handleSelectedPreferenceChange}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
      return <ActionColumnLabel className="w-24" />;
    },
    cell: ({
      row: {
        original: { project, type },
      },
    }) => (
      <div className="flex w-full items-center justify-center">
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
                href={`../projects/${project.id}`}
              >
                <CornerDownRightIcon className="h-4 w-4" />
                <span>View Project details</span>
              </Link>
            </DropdownMenuItem>
            <ConditionalRender
              allowedStages={previousStages(Stage.STUDENT_BIDDING)}
              allowed={
                <StudentPreferenceActionSubMenu
                  defaultType={type}
                  changePreference={async (newPreferenceType) =>
                    void changePreference(newPreferenceType, project.id)
                  }
                />
              }
              denied={(data) => (
                <WithTooltip
                  tip={
                    <FormatDenials
                      action="Changing student preferences"
                      {...data}
                    />
                  }
                  forDisabled
                >
                  <DropdownMenuItem disabled>
                    <button className="flex items-center gap-2 text-primary">
                      <BookmarkIcon className="size-4" />
                      <span>Change preference type to</span>
                    </button>
                  </DropdownMenuItem>
                </WithTooltip>
              )}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  };

  return [selectCol, ...userCols, actionsCol];
}
