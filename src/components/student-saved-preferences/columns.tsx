import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { PAGES } from "@/config/pages";

import { Role } from "@/db/types";

import { Button, buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { useInstanceRoles } from "../params-context";

// TODO: standardise data type

export type SavedPreferenceData = {
  id: string;
  title: string;
  supervisor: { id: string; name: string };
  rank: number;
};

export function useSavedPreferencesColumns(): ColumnDef<SavedPreferenceData>[] {
  const roles = useInstanceRoles();

  return [
    {
      id: "ID",
      accessorFn: (project) => project.id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" canFilter />
      ),
      cell: ({ row: { original: project } }) => (
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
      accessorFn: (project) => project.title,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row: { original: project } }) => (
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
      }) =>
        roles.has(Role.ADMIN) ? (
          <Link
            className={buttonVariants({ variant: "link" })}
            href={`../${PAGES.allSupervisors.href}/${id}`}
          >
            {name}
          </Link>
        ) : (
          <div className="font-medium">{name}</div>
        ),
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
}
