"use client";

import { useState } from "react";

import { type ClassValue } from "clsx";
import {
  Check,
  ChevronsUpDown,
  GraduationCapIcon,
  HashIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { type StudentDTO } from "@/dto";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export function StudentDetailsCard({
  student,
  flags,
  className,
}: {
  student: StudentDTO;
  flags: Array<{ id: string; displayName: string }>;
  className?: ClassValue;
}) {
  const params = useInstanceParams();
  const [studentFlag, setStudentFlag] = useState(student.flag.id);
  const [open, setOpen] = useState(false);

  const selectedFlag = flags.find((flag) => flag.id === studentFlag);

  const { mutateAsync: updateFlagAsync } =
    api.institution.instance.updateStudentFlag.useMutation();

  function onFlagChange(flagId: string) {
    void toast.promise(
      updateFlagAsync({ params, studentId: student.id, flagId }).then((s) => {
        setStudentFlag(s.flag.id);
      }),
      {
        loading: `Updating student flag...`,
        success: `Successfully updated student flag`,
        error: "Something went wrong",
      },
    );
  }

  return (
    <Card className={cn(className)}>
      <CardContent className="pt-6">
        <div className="flex flex-col justify-evenly gap-4">
          <div className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="mr-2 font-semibold">ID:</span>
            {student.id}
          </div>
          <div className="flex items-center">
            <HashIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="mr-2 font-semibold">Email:</span>
            {student.email}
          </div>
          <div className="flex items-center">
            <GraduationCapIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="mr-2 font-semibold">Flag:</span>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="justify-between"
                >
                  {selectedFlag ? selectedFlag.displayName : "Select flag..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search flags..." />
                  <CommandList>
                    <CommandEmpty>No flag found.</CommandEmpty>
                    <CommandGroup>
                      {flags.map((flag) => (
                        <CommandItem
                          key={flag.id}
                          value={flag.id}
                          onSelect={(currentValue) => {
                            if (currentValue !== studentFlag) {
                              setStudentFlag(flag.id);
                              onFlagChange(flag.id);
                            }
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              studentFlag === flag.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {flag.displayName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
