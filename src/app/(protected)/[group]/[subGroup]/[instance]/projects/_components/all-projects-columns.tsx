"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  LucideMoreHorizontal as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { AccessControl } from "@/components/access-control";
import { ExportCSVButton } from "@/components/export-csv";
import { useInstancePath, useInstanceStage } from "@/components/params-context";
import { StudentPreferenceActionSubMenu } from "@/components/student-preference-action-menu";
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
import { stageIn } from "@/lib/utils/permissions/stage-check";
import { User } from "@/lib/validations/auth";
import { ProjectTableDataDto } from "@/lib/validations/dto/project";
import { StudentPreferenceType } from "@/lib/validations/student-preference";

import { spacesLabels } from "@/config/spaces";
import { PreferenceType, Role, Stage } from "@/db/types";
import { PAGES } from "@/config/pages";

export function useAllProjectsColumns({
  user,
  roles,
  projectPreferences,
  hasSelfDefinedProject,
  deleteProject,
  deleteSelectedProjects,
  changePreference,
  changeSelectedPreferences,
}: {
  user: User;
  roles: Set<Role>;
  projectPreferences: Record<string, PreferenceType>;
  hasSelfDefinedProject: boolean;
  deleteProject: (id: string) => Promise<void>;
  deleteSelectedProjects: (ids: string[]) => Promise<void>;
  changePreference: (
    newType: StudentPreferenceType,
    projectId: string,
  ) => Promise<void>;
  changeSelectedPreferences: (
    newType: StudentPreferenceType,
    projectIds: string[],
  ) => Promise<void>;
}): ColumnDef<ProjectTableDataDto>[] {
  const instancePath = useInstancePath();
  const stage = useInstanceStage();

  const selectCol = getSelectColumn<ProjectTableDataDto>();

  const baseCols: ColumnDef<ProjectTableDataDto>[] = [
    {
      id: "Title",
      accessorFn: ({ title }) => title,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({
        row: {
          original: { id, title },
        },
      }) => (
        <Link
          className={cn(
            buttonVariants({ variant: "link" }),
            "inline-block h-max min-w-60 px-0 text-start",
          )}
          href={`${instancePath}/projects/${id}`}
        >
          {title}
        </Link>
      ),
    },
    {
      id: "Supervisor",
      accessorFn: (row) => row.supervisor.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Supervisor" />
      ),
      cell: ({
        row: {
          original: {
            supervisor: { id, name },
          },
        },
      }) =>
        roles.has(Role.ADMIN) ? (
          <Link
            className={buttonVariants({ variant: "link" })}
            href={`${instancePath}/${PAGES.allSupervisors.href}/${id}`}
          >
            {name}
          </Link>
        ) : (
          <p className="font-medium">{name}</p>
        ),
    },
    {
      id: "Flags",
      accessorFn: (row) => row.flags,
      header: () => <div className="text-center">Flags</div>,
      filterFn: (row, columnId, value) => {
        const ids = value as string[];
        const rowFlags = row.getValue(columnId) as TagType[];
        return rowFlags.some((e) => ids.includes(e.id));
      },
      cell: ({
        row: {
          original: { flags },
        },
      }) => (
        <div className="flex flex-col gap-2">
          {flags.length > 2 ? (
            <>
              <Badge className="w-fit" key={flags[0]!.id}>
                {flags[0]!.title}
              </Badge>
              <WithTooltip
                side="right"
                tip={
                  <ul className="flex list-disc flex-col gap-1 p-2 pl-1">
                    {flags.slice(1).map((flag) => (
                      <Badge className="w-fit" key={flag.id}>
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
              <Badge className="w-fit" key={flag.id}>
                {flag.title}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: "Keywords",
      accessorFn: (row) => row.tags,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Keywords" />
      ),
      filterFn: (row, columnId, value) => {
        const ids = value as string[];
        const rowTags = row.getValue(columnId) as TagType[];
        return rowTags.some((e) => ids.includes(e.id));
      },
      cell: ({
        row: {
          original: { tags },
        },
      }) => (
        <div className="flex flex-col gap-2">
          {tags.length > 2 ? (
            <>
              <Badge variant="outline" className="w-fit" key={tags[0]!.id}>
                {tags[0]!.title}
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
      accessorKey: "actions",
      id: "Actions",
      header: ({ table }) => {
        const someSelected =
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

        const selectedProjectIds = table
          .getSelectedRowModel()
          .rows.map((e) => e.original.id);

        const data = table
          .getSelectedRowModel()
          .rows.map((e) => [
            e.original.title,
            e.original.description,
            e.original.specialTechnicalRequirements,
            e.original.supervisor.name,
            e.original.supervisor.email,
            e.original.flags.map((f) => f.title).join("; "),
            e.original.tags.map((t) => t.title).join("; "),
          ]);

        if (someSelected && !hasSelfDefinedProject)
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
                  title={`Delete ${selectedProjectIds.length} Projects`}
                  description={`You are about to delete ${selectedProjectIds.length} projects from the ${spacesLabels.instance.short}. Do you wish to proceed?`}
                >
                  <DropdownMenuContent align="center" side="bottom">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ExportCSVButton
                        filename="all-projects"
                        text="Download selected rows"
                        header={[
                          "Title",
                          "Description",
                          "Special Technical Requirements",
                          "Supervisor Name",
                          "Supervisor Email",
                          "Flags",
                          "Keywords",
                        ]}
                        data={data}
                      />
                    </DropdownMenuItem>
                    <AccessControl
                      allowedRoles={[Role.STUDENT]}
                      allowedStages={[Stage.STUDENT_BIDDING]}
                    >
                      <StudentPreferenceActionSubMenu
                        changePreference={async (t) =>
                          void changeSelectedPreferences(t, selectedProjectIds)
                        }
                      />
                    </AccessControl>
                    <AccessControl
                      allowedRoles={[Role.ADMIN]}
                      allowedStages={[
                        Stage.PROJECT_SUBMISSION,
                        Stage.STUDENT_BIDDING,
                      ]}
                    >
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
                    </AccessControl>
                  </DropdownMenuContent>
                </YesNoActionContainer>
              </DropdownMenu>
            </div>
          );

        return <ActionColumnLabel />;
      },
      cell: ({ row, table }) => {
        const project = row.original;
        const supervisor = row.original.supervisor;

        async function handleDelete() {
          void deleteProject(project.id).then(() => {
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
                title={`Delete Project?`}
                description={`You are about to delete project "${project.title}" from the ${spacesLabels.instance.short}. Do you wish to proceed?`}
              >
                <DropdownMenuContent side="bottom">
                  <DropdownMenuLabel className="gap- flex items-center">
                    Actions
                  </DropdownMenuLabel>
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
                  <AccessControl
                    allowedRoles={[Role.STUDENT]}
                    allowedStages={[Stage.STUDENT_BIDDING]}
                    extraConditions={{ RBAC: { AND: !hasSelfDefinedProject } }}
                  >
                    <StudentPreferenceActionSubMenu
                      defaultType={projectPreferences[project.id] ?? "None"}
                      changePreference={async (t) =>
                        void changePreference(t, project.id)
                      }
                    />
                  </AccessControl>
                  <AccessControl
                    allowedRoles={[Role.ADMIN]}
                    allowedStages={[
                      Stage.PROJECT_SUBMISSION,
                      Stage.STUDENT_BIDDING,
                    ]}
                    extraConditions={{
                      RBAC: { OR: supervisor.id === user.id },
                    }}
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
                  </AccessControl>
                </DropdownMenuContent>
              </YesNoActionContainer>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (roles.has(Role.STUDENT) && stage === Stage.STUDENT_BIDDING) {
    return !hasSelfDefinedProject ? [selectCol, ...baseCols] : baseCols;
  }

  if (
    roles.has(Role.ADMIN) &&
    stageIn(stage, [Stage.PROJECT_SUBMISSION, Stage.STUDENT_BIDDING])
  ) {
    return [selectCol, ...baseCols];
  }

  return baseCols;
}
