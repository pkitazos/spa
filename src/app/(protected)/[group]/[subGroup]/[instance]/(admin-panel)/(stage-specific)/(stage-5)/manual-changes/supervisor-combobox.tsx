"use client";
import { useState } from "react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SupervisorInfo } from "./types";
import { fuzzyMatch } from "@/lib/utils/general/fuzzy-match";

interface SupervisorComboboxProps {
  supervisors: SupervisorInfo[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SupervisorCombobox({
  supervisors,
  value,
  onValueChange,
  placeholder = "Select supervisor...",
  className,
}: SupervisorComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedSupervisor = supervisors.find(
    (supervisor) => supervisor.id === value,
  );

  const filterSupervisors = (
    searchTerm: string,
    supervisor: SupervisorInfo,
  ) => {
    const search = searchTerm.toLowerCase();

    const nameMatch = fuzzyMatch(search, supervisor.name);
    if (nameMatch) return true;

    return fuzzyMatch(search, supervisor.id);
  };

  const formatSupervisorDetails = (supervisor: SupervisorInfo) => {
    return `(${supervisor.currentAllocations} current, ${supervisor.pendingAllocations} pending / ${supervisor.allocationTarget} target / ${supervisor.allocationUpperBound} max)`;
  };

  const getSupervisorStatusColor = (supervisor: SupervisorInfo) => {
    const total = supervisor.currentAllocations + supervisor.pendingAllocations;
    if (total > supervisor.allocationUpperBound) return "text-red-600";
    if (total > supervisor.allocationTarget) return "text-orange-600";
    return "text-gray-500";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[320px] justify-between", className)}
        >
          {selectedSupervisor ? (
            <div className="flex min-w-0 flex-col items-start">
              <span className="truncate font-medium">
                {selectedSupervisor.name}
              </span>
              <span
                className={cn(
                  "text-xs",
                  getSupervisorStatusColor(selectedSupervisor),
                )}
              >
                {formatSupervisorDetails(selectedSupervisor)}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0">
        <Command
          filter={(value, search) => {
            console.log("SupervisorCombobox Command filter called:", {
              value,
              search,
            });
            const supervisor = supervisors.find((s) => s.id === value);
            console.log("SupervisorCombobox found supervisor:", supervisor);
            const result =
              supervisor && filterSupervisors(search, supervisor) ? 1 : 0;
            console.log("SupervisorCombobox filter result:", result);
            return result;
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
                    console.log("SupervisorCombobox onSelect called:", {
                      currentValue,
                      value,
                    });
                    const newValue = currentValue === value ? "" : currentValue;
                    console.log(
                      "SupervisorCombobox calling onValueChange with:",
                      newValue,
                    );
                    onValueChange(newValue);
                    setOpen(false);
                  }}
                  className="p-3"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {supervisor.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supervisor.id}
                      </div>
                      <div
                        className={cn(
                          "text-xs",
                          getSupervisorStatusColor(supervisor),
                        )}
                      >
                        {formatSupervisorDetails(supervisor)}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 flex-shrink-0",
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
