import { ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  MoreHorizontalIcon as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { useInstancePath } from "@/components/params-context";
import { TagType } from "@/components/tag/tag-input";
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
import { ProjectDTO, StudentDTO, SupervisorDTO } from "@/dto";
import { PAGES } from "@/config/pages";

type PreAllocation = {
  project: ProjectDTO;
  supervisor: SupervisorDTO;
  student: StudentDTO;
};

export function usePreAllocatedProjectColumns({
  deleteProject,
  deleteSelectedProjects,
}: {
  deleteProject: (id: string) => Promise<void>;
  deleteSelectedProjects: (ids: string[]) => Promise<void>;
}): ColumnDef<PreAllocation>[] {
  const instancePath = useInstancePath();

  const selectCol = getSelectColumn<PreAllocation>();

  const userCols: ColumnDef<PreAllocation>[] = [
    {
      id: "ID",
      accessorFn: ({ project }) => project.id,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-24"
          column={column}
          title="ID"
          canFilter
        />
      ),
      cell: ({
        row: {
          original: { project },
        },
      }) => (
        <WithTooltip
          align="start"
          tip={<div className="max-w-xs">{project.id}</div>}
        >
          <p className="w-24 truncate">{project.id}</p>
        </WithTooltip>
      ),
    },
    {
      id: "Project Title",
      accessorFn: ({ project }) => project.title,
      header: () => <div className="min-w-40 py-1 pl-4">Project Title</div>,
      cell: ({
        row: {
          original: { project },
        },
      }) => (
        <WithTooltip tip={<p className="max-w-96">{project.title}</p>}>
          <Link
            className={cn(
              buttonVariants({ variant: "link" }),
              "inline-block w-40 truncate px-0 text-start",
            )}
            href={`${instancePath}/projects/${project.id}`}
          >
            {project.title}
          </Link>
        </WithTooltip>
      ),
    },
    {
      id: "Supervisor GUID",
      accessorFn: ({ supervisor }) => supervisor.id,
      header: ({ column }) => (
        <div className="w-28 py-1">
          <DataTableColumnHeader column={column} title="Supervisor GUID" />
        </div>
      ),
      cell: ({
        row: {
          original: { supervisor },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={`${instancePath}/${PAGES.allSupervisors.href}/${supervisor.id}`}
        >
          {supervisor.id}
        </Link>
      ),
    },
    {
      id: "Flags",
      accessorFn: ({ project }) => project.flags,
      header: () => <div className="text-center">Flags</div>,
      filterFn: (row, columnId, value) => {
        const ids = value as string[];
        const rowFlags = row.getValue(columnId) as TagType[];
        return rowFlags.some((e) => ids.includes(e.id));
      },
      cell: ({
        row: {
          original: {
            project: { flags },
          },
        },
      }) => (
        <div className="flex flex-col gap-2">
          {flags.length > 2 ? (
            <>
              <Badge className="w-fit" key={flags[0].id}>
                {flags[0].title}
              </Badge>
              <WithTooltip
                side="right"
                tip={
                  <ul className="flex list-disc flex-col gap-1 p-2 pl-1">
                    {flags.slice(1).map((flag) => (
                      <Badge className="w-max max-w-40" key={flag.id}>
                        {flag.title}
                      </Badge>
                    ))}
                  </ul>
                }
              >
                <div className={cn(badgeVariants(), "w-fit font-normal")}>
                  {flags.length - 1}+
                </div>
              </WithTooltip>
            </>
          ) : (
            flags.map((flag) => (
              <Badge className="w-max max-w-40" key={flag.id}>
                {flag.title}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: "Keywords",
      accessorFn: ({ project }) => project.tags,
      header: () => <div className="text-center">Keywords</div>,
      filterFn: (row, columnId, value) => {
        const ids = value as string[];
        const rowTags = row.getValue(columnId) as TagType[];
        return rowTags.some((e) => ids.includes(e.id));
      },
      cell: ({
        row: {
          original: {
            project: { tags },
          },
        },
      }) => (
        <div className="flex flex-col gap-2">
          {tags.length > 2 ? (
            <>
              <Badge variant="outline" className="w-fit" key={tags[0].id}>
                {tags[0].title}
              </Badge>
              <WithTooltip
                side="right"
                tip={
                  <ul className="flex list-disc flex-col gap-1 p-2 pl-1">
                    {tags.slice(1).map((tag) => (
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
                  {tags.length - 1}+
                </div>
              </WithTooltip>
            </>
          ) : (
            tags.map((tag) => (
              <Badge variant="outline" className="w-fit" key={tag.id}>
                {tag.title}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      accessorFn: (p) => p.student.id,
      id: "Student GUID",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-20"
          column={column}
          title="Student GUID"
        />
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
          {student.id}
        </Link>
      ),
    },
    {
      accessorKey: "actions",
      id: "Actions",
      header: ({ table }) => {
        const someSelected =
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

        const selectedProjectIds = table
          .getSelectedRowModel()
          .rows.map((e) => e.original.project.id);

        async function handleDeleteSelected() {
          void deleteSelectedProjects(selectedProjectIds).then(() => {
            table.toggleAllRowsSelected(false);
          });
        }

        if (someSelected) {
          return (
            <div className="flex w-24 items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <span className="sr-only">Open menu</span>
                    <MoreIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <YesNoActionContainer
                  action={handleDeleteSelected}
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
                            <span>Delete Selected Projects</span>
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
        return <ActionColumnLabel className="w-24" />;
      },
      cell: ({
        row: {
          original: { project },
        },
      }) => (
        <div className="flex w-24 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <YesNoActionContainer
              action={() => deleteProject(project.id)}
              title="Delete Project?"
              description={`You are about to delete project ${project.id}. Do you wish to proceed?`}
            >
              <DropdownMenuContent align="center" side="bottom">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`${instancePath}/projects/${project.id}`}
                  >
                    <CornerDownRightIcon className="h-4 w-4" />
                    <p className="flex items-center">
                      View &quot;
                      <p className="max-w-40 truncate">{project.title}</p>
                      &quot;
                    </p>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`${instancePath}/projects/${project.id}/edit`}
                  >
                    <PenIcon className="h-4 w-4" />
                    <span>Edit Project details</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-red-100/40 focus:text-destructive">
                  <YesNoActionTrigger
                    trigger={
                      <button className="flex items-center gap-2">
                        <Trash2Icon className="h-4 w-4" />
                        <span>Delete Project</span>
                      </button>
                    }
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </YesNoActionContainer>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return [selectCol, ...userCols];
}
