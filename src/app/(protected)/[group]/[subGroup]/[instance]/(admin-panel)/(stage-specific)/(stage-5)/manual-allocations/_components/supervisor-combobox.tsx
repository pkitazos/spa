"use client";

import { useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { fuzzyMatch } from "@/lib/utils/general/fuzzy-match";

import { type ManualAllocationSupervisor } from "./manual-allocation-types";

interface SupervisorComboboxProps {
  supervisors: ManualAllocationSupervisor[];
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function SupervisorCombobox({
  supervisors,
  value,
  onValueChange,
  className,
}: SupervisorComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedSupervisor = supervisors.find(
    (supervisor) => supervisor.id === value,
  );

  const filterSupervisors = (
    searchTerm: string,
    supervisor: ManualAllocationSupervisor,
  ) => {
    const search = searchTerm.toLowerCase();

    const nameMatch = fuzzyMatch(search, supervisor.name);
    if (nameMatch) return true;

    return fuzzyMatch(search, supervisor.id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-[40px] w-[320px] justify-between p-3",
            className,
          )}
        >
          {selectedSupervisor ? (
            <SupervisorCell supervisor={selectedSupervisor} selected />
          ) : (
            <span className="text-muted-foreground">Select supervisor...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0">
        <Command
          filter={(value, search) => {
            const supervisor = supervisors.find((s) => s.id === value);
            return supervisor && filterSupervisors(search, supervisor) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search supervisors..." className="h-9" />
          <CommandList>
            <CommandEmpty>No supervisor found.</CommandEmpty>
            <CommandGroup>
              {supervisors.map((supervisor) => (
                <CommandItem
                  key={supervisor.id}
                  value={supervisor.id}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    onValueChange(newValue);
                    setOpen(false);
                  }}
                  className="p-3"
                >
                  <div className="flex w-full items-center justify-between">
                    <SupervisorCell supervisor={supervisor} />
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        value === supervisor.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SupervisorCell({
  supervisor,
  selected = false,
}: {
  supervisor: ManualAllocationSupervisor;
  selected?: boolean;
}) {
  const getSupervisorStatusColor = (supervisor: ManualAllocationSupervisor) => {
    const total = supervisor.currentAllocations + supervisor.pendingAllocations;
    if (total > supervisor.allocationUpperBound) return "text-red-600";
    if (total > supervisor.allocationTarget) return "text-orange-600";
    return "text-gray-500";
  };
  const formatSupervisorDetails = (supervisor: ManualAllocationSupervisor) => {
    return `(${supervisor.currentAllocations} current, ${supervisor.pendingAllocations} pending / ${supervisor.allocationTarget} target / ${supervisor.allocationUpperBound} max)`;
  };

  if (selected) {
    return (
      <div className="flex w-full min-w-0 flex-col items-start">
        <span className="truncate pr-2 text-sm font-medium">
          {supervisor.name}
        </span>
        <span
          className={cn("mt-1 text-xs", getSupervisorStatusColor(supervisor))}
        >
          {formatSupervisorDetails(supervisor)}
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-medium">{supervisor.name}</div>
      <div className="text-sm text-gray-500">{supervisor.id}</div>
      <div className={cn("text-xs", getSupervisorStatusColor(supervisor))}>
        {formatSupervisorDetails(supervisor)}
      </div>
    </div>
  );
}
