"use client";

import { useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { ProjectAllocationStatus } from "@/dto";

import { Badge } from "@/components/ui/badge";
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

import { type ManualAllocationProject } from "./manual-allocation-types";

interface ProjectComboboxProps {
  projects: ManualAllocationProject[];
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function ProjectCombobox({
  projects,
  value,
  onValueChange,
  className,
}: ProjectComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProject = projects.find((project) => project.id === value);

  const filterProjects = (
    searchTerm: string,
    project: ManualAllocationProject,
  ) => {
    const search = searchTerm.toLowerCase();

    const titleMatch = fuzzyMatch(search, project.title);
    if (titleMatch) return true;

    return fuzzyMatch(search, project.id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-[40px] w-[350px] justify-between p-3",
            className,
          )}
        >
          {selectedProject ? (
            <ProjectCell project={selectedProject} selected />
          ) : (
            <span className="text-muted-foreground">Select project...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command
          filter={(value, search) => {
            const project = projects.find((p) => p.id === value);
            return project && filterProjects(search, project) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search projects..." className="h-9" />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    onValueChange(newValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer p-4"
                >
                  <div className="flex w-full items-start justify-between">
                    <ProjectCell project={project} />
                    <Check
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0",
                        value === project.id ? "opacity-100" : "opacity-0",
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

function ProjectCell({
  project,
  selected = false,
}: {
  project: ManualAllocationProject;
  selected?: boolean;
}) {
  const getStatusColor = (status: ProjectAllocationStatus) => {
    switch (status) {
      case ProjectAllocationStatus.UNALLOCATED:
        return "text-green-600 bg-green-100 border-green-200";
      case ProjectAllocationStatus.RANDOM:
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case ProjectAllocationStatus.MANUAL:
        return "text-amber-600 bg-amber-100 border-amber-200";
      case ProjectAllocationStatus.ALGORITHMIC:
        return "text-orange-600 bg-orange-100 border-orange-200";
      case ProjectAllocationStatus.PRE_ALLOCATED:
        return "text-red-600 bg-red-100 border-red-200";
    }
  };

  const getStatusLabel = (status: ProjectAllocationStatus) => {
    switch (status) {
      case ProjectAllocationStatus.UNALLOCATED:
        return "Available";
      case ProjectAllocationStatus.RANDOM:
        return "Randomly Allocated";
      case ProjectAllocationStatus.PRE_ALLOCATED:
        return "Pre-allocated";
      case ProjectAllocationStatus.ALGORITHMIC:
        return "Algorithmically Allocated";
      case ProjectAllocationStatus.MANUAL:
        return "Manually Allocated";
    }
  };

  if (selected) {
    return (
      <div className="flex w-full min-w-0 flex-col items-start">
        <div className="flex w-full items-center justify-between">
          <span className="truncate pr-2 text-sm font-medium">
            {project.title}
          </span>
          <div
            className={cn(
              "shrink-0 rounded-full border px-2 py-1 text-xs font-medium",
              getStatusColor(project.status),
            )}
          >
            {getStatusLabel(project.status)}
          </div>
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          #{project.id}
        </span>
      </div>
    );
  }

  return (
    <div className="mr-3 min-w-0 flex-1">
      <div className="mb-2 flex items-start justify-between">
        <h4 className="pr-2 text-sm font-medium leading-tight">
          {project.title}
        </h4>
        <div
          className={cn(
            "shrink-0 rounded-full border px-2 py-1 text-xs font-medium",
            getStatusColor(project.status),
          )}
        >
          {getStatusLabel(project.status)}
        </div>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">#{project.id}</p>
      <div className="flex flex-wrap gap-1">
        {project.flags.map((flag) => (
          <Badge key={flag.id} variant="accent" className="rounded-md">
            {flag.displayName}
          </Badge>
        ))}
      </div>
    </div>
  );
}
