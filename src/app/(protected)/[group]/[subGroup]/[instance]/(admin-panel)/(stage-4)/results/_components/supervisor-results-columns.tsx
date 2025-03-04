import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { SupervisorMatchingDetailsDto } from "@/lib/validations/matching";
import { UserDTO } from "@/dto";

export function useSupervisorResultsColumns(): ColumnDef<{
  supervisor: UserDTO;
  matchingDetails: SupervisorMatchingDetailsDto;
}>[] {
  return [
    {
      id: "GUID",
      accessorFn: (s) => s.supervisor.id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GUID" canFilter />
      ),
    },
    {
      id: "Name",
      accessorFn: (s) => s.supervisor.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({
        row: {
          original: { supervisor },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={`./supervisors/${supervisor.id}`}
        >
          {supervisor.name}
        </Link>
      ),
    },
    {
      id: "Target",
      accessorFn: (s) => s.matchingDetails.projectTarget,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title={"Target Considered (Actual)"}
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-28 text-center">
          {s.matchingDetails.projectTarget} ({s.matchingDetails.actualTarget})
        </p>
      ),
      sortingFn: (a, b) =>
        a.original.matchingDetails.projectTarget -
        b.original.matchingDetails.projectTarget,
    },
    {
      id: "Upper Quota",
      accessorFn: (s) => s.matchingDetails.projectUpperQuota,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title="Upper Quota Considered (Actual)"
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-28 text-center">
          {s.matchingDetails.projectUpperQuota} (
          {s.matchingDetails.actualUpperQuota})
        </p>
      ),
      sortingFn: (a, b) =>
        a.original.matchingDetails.projectUpperQuota -
        b.original.matchingDetails.projectUpperQuota,
    },
    {
      id: "Allocation Count",
      accessorFn: (s) => s.matchingDetails.allocationCount,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title="Allocation Count (Pre-allocated)"
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-28 text-center">
          {s.matchingDetails.allocationCount} (
          {s.matchingDetails.preAllocatedCount})
        </p>
      ),
      sortingFn: (a, b) =>
        a.original.matchingDetails.allocationCount -
        b.original.matchingDetails.allocationCount,
    },
    // {
    //   id: "Algorithm Allocation Difference",
    //   accessorFn: (s) => s.algorithmTargetDifference,
    //   header: ({ column }) => (
    //     <DataTableColumnHeader
    //       className="w-28"
    //       column={column}
    //       title="Algorithm Allocation Difference"
    //     />
    //   ),
    //   cell: ({ row: { original: s } }) => (
    //     <p className="w-28 text-center">
    //       {s.algorithmTargetDifference > 0
    //         ? `+${s.algorithmTargetDifference}`
    //         : s.algorithmTargetDifference}
    //     </p>
    //   ),
    // },
    {
      id: "Target Difference",
      accessorFn: (s) => s.matchingDetails.actualTargetDifference,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title="Actual Target Difference"
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-28 text-center">
          {s.matchingDetails.actualTargetDifference > 0
            ? `+${s.matchingDetails.actualTargetDifference}`
            : s.matchingDetails.actualTargetDifference}
        </p>
      ),
    },
  ];
}
