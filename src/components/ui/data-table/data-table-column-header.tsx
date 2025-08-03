import type { Column } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EyeOffIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex h-full items-center space-x-2 py-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="my-1.5 -ml-1 flex h-full min-h-8 gap-2 py-1 text-left"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="h-4 min-w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="h-4 min-w-4" />
            ) : (
              <ArrowUpDownIcon className="h-4 min-w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="backdrop-blur-lg" align="start">
          {column.getIsSorted() && (
            <DropdownMenuItem onClick={() => column.clearSorting()}>
              <XIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Clear
            </DropdownMenuItem>
          )}
          {column.getIsSorted() !== "asc" && (
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Asc
            </DropdownMenuItem>
          )}
          {column.getIsSorted() !== "desc" && (
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Desc
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOffIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
