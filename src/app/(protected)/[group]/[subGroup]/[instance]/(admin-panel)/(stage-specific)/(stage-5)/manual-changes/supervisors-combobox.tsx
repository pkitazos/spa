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

import { SupervisorDTO } from "@/dto";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export function SupervisorsCombobox({
  supervisors,
}: {
  supervisors: SupervisorDTO[];
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");

  const selected = supervisors.find((s) => s.id === value);

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
              <span className="font-semibold">{selected.name}</span>
              <span className="mx-2 text-gray-500">{selected.id}</span>
              <span className="text-sky-600">{selected.allocationTarget}</span>
              <span className="mx-1 text-gray-400">|</span>
              <span className="text-sky-600">
                {selected.allocationUpperBound}
              </span>
            </>
          ) : (
            "Select supervisor..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search supervisor..." className="h-9" />
          <CommandList>
            <CommandEmpty>No supervisor found.</CommandEmpty>
            <CommandGroup>
              {supervisors.map((supervisor) => (
                <CommandItem
                  key={supervisor.id}
                  value={supervisor.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold">{supervisor.name}</span>
                  <span className="mx-2 text-gray-500">{supervisor.id}</span>
                  <span className="text-sky-600">
                    {supervisor.allocationTarget}
                  </span>
                  <span className="mx-1 text-gray-400">|</span>
                  <span className="text-sky-600">
                    {supervisor.allocationUpperBound}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto",
                      value === supervisor.id ? "opacity-100" : "opacity-0",
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
