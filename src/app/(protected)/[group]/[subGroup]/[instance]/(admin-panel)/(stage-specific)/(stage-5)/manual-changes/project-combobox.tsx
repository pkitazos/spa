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
import { ProjectInfo } from "./types";
import { fuzzyMatch } from "@/lib/utils/general/fuzzy-match";
import { ProjectAllocationStatus } from "@/dto";
import { Badge } from "@/components/ui/badge";

type ProjectWithStatus = ProjectInfo & { status: ProjectAllocationStatus };

interface ProjectComboboxProps {
  projects: ProjectWithStatus[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Project Combobox Component
export function ProjectCombobox({
  projects,
  value,
  onValueChange,
  placeholder = "Select project...",
  className,
}: ProjectComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProject = projects.find((project) => project.id === value);

  const filterProjects = (searchTerm: string, project: ProjectWithStatus) => {
    const search = searchTerm.toLowerCase();

    const titleMatch = fuzzyMatch(search, project.title);
    if (titleMatch) return true;

    return fuzzyMatch(search, project.id);
  };

  const getStatusBadgeVariant = (status: ProjectAllocationStatus) => {
    switch (status) {
      case ProjectAllocationStatus.UNALLOCATED:
        return "success";
      case ProjectAllocationStatus.PRE_ALLOCATED:
        return "destructive";
      case ProjectAllocationStatus.ALLOCATED:
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: ProjectAllocationStatus) => {
    switch (status) {
      case ProjectAllocationStatus.UNALLOCATED:
        return "Available";
      case ProjectAllocationStatus.PRE_ALLOCATED:
        return "Pre-allocated";
      case ProjectAllocationStatus.ALLOCATED:
        return "Allocated";
      default:
        return status;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[350px] justify-between", className)}
        >
          {selectedProject ? (
            <div className="flex w-full min-w-0 items-center justify-between">
              <div className="mr-2 flex min-w-0 items-center">
                <span className="truncate font-medium">
                  {selectedProject.title}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {selectedProject.id}
                </span>
              </div>
              <Badge
                variant={getStatusBadgeVariant(selectedProject.status)}
                className="flex-shrink-0 text-xs"
              >
                {getStatusLabel(selectedProject.status)}
              </Badge>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-3xl p-0">
        <Command
          filter={(value, search) => {
            console.log("ProjectCombobox Command filter called:", {
              value,
              search,
            });
            const project = projects.find((p) => p.id === value);
            console.log("ProjectCombobox found project:", project);
            const result = project && filterProjects(search, project) ? 1 : 0;
            console.log("ProjectCombobox filter result:", result);
            return result;
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
                    console.log("ProjectCombobox onSelect called:", {
                      currentValue,
                      value,
                    });
                    const newValue = currentValue === value ? "" : currentValue;
                    console.log(
                      "ProjectCombobox calling onValueChange with:",
                      newValue,
                    );
                    onValueChange(newValue);
                    setOpen(false);
                  }}
                  className="p-3"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center">
                        <span className="truncate font-medium">
                          {project.title}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          #{project.id}
                        </span>
                      </div>
                      <div className="mb-1 flex items-center gap-1">
                        {project.flags.map((flag) => (
                          <Badge
                            key={flag.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {flag.title}
                          </Badge>
                        ))}
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(project.status)}
                        className="text-xs"
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 flex-shrink-0",
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
