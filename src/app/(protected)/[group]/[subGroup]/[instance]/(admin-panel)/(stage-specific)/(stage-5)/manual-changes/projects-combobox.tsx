"use client";
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

import { ProjectAllocationStatus } from "@/dto";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export function ProjectsCombobox({
  projects,
}: {
  projects: Array<{
    project: { id: string; title: string };
    status: ProjectAllocationStatus;
  }>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");

  const selected = projects.find(({ project }) => project.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {selected ? (
            <>
              <span className="font-semibold">{selected.project.title}</span>
              <span className="mx-2 text-gray-500">{selected.project.id}</span>
              <span
                className={cn(
                  selected.status === ProjectAllocationStatus.UNALLOCATED &&
                    "text-blue-500",
                  selected.status === ProjectAllocationStatus.PRE_ALLOCATED &&
                    "text-red-500",
                  selected.status === ProjectAllocationStatus.ALLOCATED &&
                    "text-rose-500",
                )}
              >
                {selected.status}
              </span>
            </>
          ) : (
            "Select project..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-xl p-0">
        <Command>
          <CommandInput placeholder="Search project..." className="h-9" />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects.map(({ project, status }) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold">{project.title}</span>
                  <span className="mx-2 text-gray-500">{project.id}</span>
                  <span
                    className={cn(
                      status === ProjectAllocationStatus.UNALLOCATED &&
                        "text-blue-500",
                      status === ProjectAllocationStatus.PRE_ALLOCATED &&
                        "text-red-500",
                      status === ProjectAllocationStatus.ALLOCATED &&
                        "text-rose-500",
                    )}
                  >
                    {status}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto",
                      value === project.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
