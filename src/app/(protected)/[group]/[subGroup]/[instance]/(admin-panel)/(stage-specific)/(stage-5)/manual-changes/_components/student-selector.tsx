"use client";
import { useState } from "react";
import { ClassValue } from "clsx";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LabelledSeparator } from "@/components/ui/labelled-separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

import { useAllocDetails } from "./allocation-store";

export function StudentSelector({ className }: { className?: ClassValue }) {
  const [open, setOpen] = useState(false);
  const [menuStudentId, setMenuStudentId] = useState<string | null>(null);

  const students = useAllocDetails((s) => s.students);
  const selectedStudentIds = useAllocDetails((s) => s.selectedStudentIds);
  const setSelectedStudentIds = useAllocDetails((s) => s.setSelectedStudentIds);

  const availableStudents = students.filter(
    (e) => !selectedStudentIds.includes(e.student.id),
  );

  function updateRows(studentId: string) {
    setMenuStudentId(null);
    const newStudent = availableStudents.find(
      ({ student }) => student.id === studentId,
    );
    if (!newStudent) return;
    setSelectedStudentIds([...selectedStudentIds, newStudent.student.id]);
  }

  function handleStudentSelection(studentId: string) {
    const selectedStudent =
      availableStudents.find((s) => s.student.id === studentId) || null;
    if (!selectedStudent) return;

    setMenuStudentId(selectedStudent.student.id);
    setOpen(true);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[200px] justify-center overflow-hidden pr-1"
            >
              {menuStudentId ? menuStudentId : "Select Student"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <StudentList
              handleStudentSelection={handleStudentSelection}
              students={availableStudents.map(({ student }) => student.id)}
            />
          </PopoverContent>
        </Popover>
        <Button
          disabled={!menuStudentId}
          size="icon"
          onClick={() => updateRows(menuStudentId!)}
        >
          <Plus className="h-5 w-5 font-bold" />
        </Button>
      </div>
      <LabelledSeparator label="or" />
      <Button
        className="w-full"
        variant="outline"
        onClick={() => setSelectedStudentIds(students.map((s) => s.student.id))}
      >
        Select all Students
      </Button>
    </div>
  );
}

function StudentList({
  students,
  handleStudentSelection,
}: {
  students: string[];
  handleStudentSelection: (studentId: string) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Search Students..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {students.map((studentId) => (
            <CommandItem
              className="overflow-hidden text-ellipsis"
              key={studentId}
              value={studentId}
              onSelect={handleStudentSelection}
            >
              {studentId}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
