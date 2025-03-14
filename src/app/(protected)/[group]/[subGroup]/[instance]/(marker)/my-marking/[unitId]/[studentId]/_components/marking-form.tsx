"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import layoutData from "@/components/layout.json";

import { GRADES } from "@/config/grades";

type TEMPMarkingFormData2 = {
  marks: {
    assessmentCriterionId: string;
    mark: number;
    justification: string;
  }[];
  finalComment: string;
  recommendation: boolean;
  draft: boolean;
};

export function MarkingForm({
  submissionButtonLabel,
  project,
  onSubmit,
}: {
  submissionButtonLabel: string;
  onSubmit: (data: TEMPMarkingFormData2) => void;
  project: TEMPMarkingFormData2;
}) {
  const form = useForm<TEMPMarkingFormData2>({
    defaultValues: {
      draft: true,
      finalComment: project.finalComment,
      recommendation: project.recommendation,
      marks: project.marks,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        {layoutData.layout.map((field) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [open, setOpen] = React.useState(false);
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [value, setValue] = React.useState<number | null>(null);

          return (
            <FormField
              key={field.id}
              control={form.control}
              name={`marks.${field.id - 1}`}
              render={({ field: formField }) => (
                <FormItem>
                  <FormControl>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {value !== null
                            ? GRADES.find((grade) => grade.value === value)
                                ?.label
                            : "Select grade..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search grade..." />
                          <CommandList>
                            <CommandEmpty>No grade found.</CommandEmpty>
                            <CommandGroup>
                              {GRADES.map((grade) => (
                                <CommandItem
                                  key={grade.value}
                                  onSelect={() => {
                                    setValue(grade.value);
                                    formField.onChange(grade.value);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      grade.value === value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {grade.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormDescription>{field.description}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
        <div className="mt-16 flex justify-end gap-8">
          <Button variant="outline" size="lg">
            Save
          </Button>
          <Button type="submit" size="lg">
            {submissionButtonLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
