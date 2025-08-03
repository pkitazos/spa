import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  LucideMoreHorizontal as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { PAGES } from "@/config/pages";

import {
  flagDtoSchema,
  ProjectAllocationStatus,
  type ProjectDTO,
  type StudentDTO,
} from "@/dto";

import { Stage } from "@/db/types";

import { AccessControl } from "@/components/access-control";
import { CircleCheckSolidIcon } from "@/components/icons/circle-check";
import { useInstancePath, useInstanceStage } from "@/components/params-context";
import { tagTypeSchema } from "@/components/tag/tag-input";
import { Badge, badgeVariants } from "@/components/ui/badge";
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
import {
  YesNoActionContainer,
  YesNoActionTrigger,
} from "@/components/yes-no-action";

import { cn } from "@/lib/utils";
import { setIntersection } from "@/lib/utils/general/set-intersection";
import {
  previousStages,
  stageGte,
  stageLt,
} from "@/lib/utils/permissions/stage-check";

type ProjectWithAllocation = {
  project: ProjectDTO;
  allocatedStudent?: StudentDTO;
};

export function useSupervisorProjectsColumns({
  deleteProject,
  deleteSelectedProjects,
}: {
  deleteProject: (id: string) => Promise<void>;
  deleteSelectedProjects: (ids: string[]) => Promise<void>;
}): ColumnDef<ProjectWithAllocation>[] {
  const stage = useInstanceStage();
  const instancePath = useInstancePath();

  const selectCol = getSelectColumn<ProjectWithAllocation>();

  const userCols: ColumnDef<ProjectWithAllocation>[] = [
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
              <div className="w-16 truncate">{project.id}</div>
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
          className={cn(
            buttonVariants({ variant: "link" }),
            "inline-block h-max w-60 px-0 text-start",
          )}
          href={`${instancePath}/projects/${project.id}`}
        >
          {project.title}
        </Link>
      ),
    },
    {
      id: "Flags",
      accessorFn: ({ project }) => project.flags,
      header: () => <div className="text-center">Flags</div>,
      filterFn: (row, columnId, value) => {
        const selectedFilters = z.array(z.string()).parse(value);
        const rowFlags = z.array(flagDtoSchema).parse(row.getValue(columnId));

        return (
          new Set(rowFlags.map((f) => f.id)).size > 0 &&
          selectedFilters.some((f) => rowFlags.some((rf) => rf.id === f))
        );
      },
      cell: ({
        row: {
          original: { project },
        },
      }) => (
        <div className="flex flex-col gap-2">
          {project.flags.length > 2 ? (
            <>
              <Badge
                variant="accent"
                className="w-40 rounded-md"
                key={project.flags[0].id}
              >
                {project.flags[0].displayName}
              </Badge>
              <WithTooltip
                side="right"
                tip={
                  <ul className="flex list-disc flex-col gap-1 p-2 pl-1">
                    {project.flags.slice(1).map((flag) => (
                      <Badge
                        variant="accent"
                        className="w-40 rounded-md"
                        key={flag.id}
                      >
                        {flag.displayName}
                      </Badge>
                    ))}
                  </ul>
                }
              >
                <div
                  className={cn(
                    badgeVariants({ variant: "accent" }),
                    "w-fit rounded-md font-normal",
                  )}
                >
                  {project.flags.length - 1}+
                </div>
              </WithTooltip>
            </>
          ) : (
            project.flags.map((flag) => (
              <Badge variant="accent" className="w-40 rounded-md" key={flag.id}>
                {flag.displayName}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: "Keywords",
      accessorFn: ({ project }) => project.tags,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Keywords" />
      ),
      filterFn: (row, columnId, value) => {
        const ids = value as string[];
        const rowTags = z.array(tagTypeSchema).parse(row.getValue(columnId));
        return rowTags.some((t) => ids.includes(t.id));
      },
      cell: ({
        row: {
          original: { project },
        },
      }) => (
        <div className="flex flex-col gap-2">
          {project.tags.length > 2 ? (
            <>
              <Badge
                variant="outline"
                className="w-fit"
                key={project.tags[0].id}
              >
                {project.tags[0].title}
              </Badge>
              <WithTooltip
                side="right"
                tip={
                  <ul className="flex list-disc flex-col gap-1 p-2 pl-1">
                    {project.tags.slice(1).map((tag) => (
                      <Badge variant="outline" className="w-fit" key={tag.id}>
                        {tag.title}
                      </Badge>
                    ))}
                  </ul>
                }
              >
                <div
                  className={cn(
                    badgeVariants({ variant: "outline" }),
                    "w-fit font-normal",
                  )}
                >
                  {project.tags.length - 1}+
                </div>
              </WithTooltip>
            </>
          ) : (
            project.tags.map((tag) => (
              <Badge variant="outline" className="w-fit" key={tag.id}>
                {tag.title}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      accessorFn: ({ project }) => project.preAllocatedStudentId,
      id: "Student",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title="Student"
        />
      ),
      cell: ({
        row: {
          original: { project, allocatedStudent },
        },
      }) => {
        if (allocatedStudent) {
          return (
            <Link
              className={cn(
                buttonVariants({ variant: "link" }),
                "items-center gap-2",
              )}
              href={`../${PAGES.allStudents.href}/${allocatedStudent.id}`}
            >
              <span>{allocatedStudent.id}</span>
              {allocatedStudent.id === project.preAllocatedStudentId && (
                <WithTooltip tip={"This is a pre-allocated project"}>
                  <div className="flex items-center justify-center">
                    <CircleCheckSolidIcon className="h-4 w-4 fill-blue-500" />
                  </div>
                </WithTooltip>
              )}
            </Link>
          );
        }
      },
      filterFn: ({ original: { project, allocatedStudent } }, _, value) => {
        const filters = z.array(z.enum(ProjectAllocationStatus)).parse(value);

        const allocationStatus = new Set<ProjectAllocationStatus>(); // default to unallocated

        if (!project.preAllocatedStudentId && !allocatedStudent) {
          allocationStatus.add(ProjectAllocationStatus.UNALLOCATED);
        } else if (project.preAllocatedStudentId) {
          allocationStatus.add(ProjectAllocationStatus.PRE_ALLOCATED);
        } else if (!!allocatedStudent && !project.preAllocatedStudentId) {
          allocationStatus.add(ProjectAllocationStatus.ALGORITHMIC);
        }

        return (
          setIntersection(filters, Array.from(allocationStatus), (x) => x)
            .length > 0
        );
      },
    },
  ];

  const actionsCol: ColumnDef<ProjectWithAllocation> = {
    id: "actions",
    header: ({ table }) => {
      const someSelected =
        table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

      const selectedProjectIds = table
        .getSelectedRowModel()
        .rows.map(({ original: { project } }) => project.id);

      if (someSelected && stageLt(stage, Stage.PROJECT_ALLOCATION)) {
        return (
          <div className="flex w-14 items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <span className="sr-only">Open menu</span>
                  <MoreIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <YesNoActionContainer
                action={async () =>
                  void deleteSelectedProjects(selectedProjectIds)
                }
                title="Delete Projects?"
                description={
                  selectedProjectIds.length === 1
                    ? `You are about to delete "${selectedProjectIds[0]}". Do you wish to proceed?`
                    : `You are about to delete ${selectedProjectIds.length} projects. Do you wish to proceed?`
                }
              >
                <DropdownMenuContent align="center" side="bottom">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:bg-red-100/40 focus:text-destructive">
                    <YesNoActionTrigger
                      trigger={
                        <button className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" />
                          <span>Delete selected Projects</span>
                        </button>
                      }
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </YesNoActionContainer>
            </DropdownMenu>
          </div>
        );
      }
      return <ActionColumnLabel />;
    },
    cell: ({
      row: {
        original: { project },
      },
      table,
    }) => {
      async function handleDelete() {
        await deleteProject(project.id).then(() => {
          table.toggleAllRowsSelected(false);
        });
      }
      return (
        <div className="flex w-14 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <YesNoActionContainer
              action={handleDelete}
              title="Delete Project?"
              description={`You are about to delete project ${project.id}. Do you wish to proceed?`}
            >
              <DropdownMenuContent side="bottom">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`../projects/${project.id}`}
                  >
                    <CornerDownRightIcon className="h-4 w-4" />
                    <p className="flex items-center">
                      View &quot;
                      <p className="max-w-40 truncate">{project.title}</p>
                      &quot;
                    </p>
                  </Link>
                </DropdownMenuItem>
                <AccessControl
                  allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                >
                  <DropdownMenuItem className="group/item">
                    <Link
                      className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                      href={`${instancePath}/projects/${project.id}/edit`}
                    >
                      <PenIcon className="h-4 w-4" />
                      <span>Edit Project details</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="group/item2 text-destructive focus:bg-red-100/40 focus:text-destructive">
                    <YesNoActionTrigger
                      trigger={
                        <button className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" />
                          <span>Delete Project</span>
                        </button>
                      }
                    />
                  </DropdownMenuItem>
                </AccessControl>
              </DropdownMenuContent>
            </YesNoActionContainer>
          </DropdownMenu>
        </div>
      );
    },
  };

  return stageGte(stage, Stage.PROJECT_ALLOCATION)
    ? [...userCols, actionsCol]
    : [selectCol, ...userCols, actionsCol];
}
