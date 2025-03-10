"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Form, FormLabel } from "@/components/ui/form";
import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import {
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
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import {
  AssessmentCriterionDTO,
  AssessmentCriterionWithScoreDTO,
  UnitOfAssessmentGradeDTO,
  unitOfAssessmentGradeDtoSchema,
} from "@/dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { Control, useForm } from "react-hook-form";
import { GRADES } from "@/config/grades";
import { useState } from "react";
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { YesNoAction } from "@/components/yes-no-action";

export function MarkingSection({
  markingCriteria,
  studentId,
  unitOfAssessmentId,
}: {
  markingCriteria: AssessmentCriterionWithScoreDTO[];
  studentId: string;
  unitOfAssessmentId: string;
}) {
  const params = useInstanceParams();
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editAsync } = api.user.marker.updateMarks.useMutation();

  const form = useForm<UnitOfAssessmentGradeDTO>({
    resolver: zodResolver(unitOfAssessmentGradeDtoSchema),
    defaultValues: {
      draft: true,
      finalComment: "",
      recommendation: false,
      studentId,
      unitOfAssessmentId,
    },
  });

  const handleSubmit = form.handleSubmit((data: UnitOfAssessmentGradeDTO) => {
    void toast.promise(
      editAsync({ params, ...data }).then(() => {
        router.push(`${instancePath}/my-marking`);
        router.refresh();
      }),
      {
        loading: `Submitting marks for Student ${data.studentId}...`,
        error: "Something went wrong",
        success: `Successfully submitted marks for Student ${data.studentId}`,
      },
    );
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        {markingCriteria.map(({ criterion }) => (
          <AssessmentCriterionField
            criterion={criterion}
            control={form.control}
          />
        ))}
        <FormField
          control={form.control}
          name="finalComment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea placeholder="Final Comments" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recommendation"
          render={({ field: { value, ...field } }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox defaultChecked={value} {...field} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Up For A Prize?</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <div className="mt-16 flex justify-end gap-8">
          <Button
            onClick={() => alert("Saved!")}
            type="button"
            variant="outline"
            size="lg"
          >
            Save
          </Button>
          <YesNoAction
            disabled={!form.formState.isValid}
            action={handleSubmit}
            trigger={
              <Button type="submit" size="lg">
                Submit Marks
              </Button>
            }
            title="Submit Marks"
            description="Are you sure you're ready to submit your marks"
          />
        </div>
      </form>
    </Form>
  );
}

function AssessmentCriterionField({
  criterion,
  control,
}: {
  criterion: AssessmentCriterionDTO;
  control: Control<UnitOfAssessmentGradeDTO>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment key={criterion.id}>
      <FormField
        control={control}
        name={`marks.${criterion.id}.mark`}
        render={({ field }) => (
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
                    {field.value !== null
                      ? GRADES.find((grade) => grade.value === field.value)
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
                              field.onChange(grade.value);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                grade.value === field.value
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
            <FormDescription>{criterion.description}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        key={criterion.id}
        control={control}
        name={`marks.${criterion.id}.justification`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormDescription>
              A justification for your chosen mark
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </React.Fragment>
  );
}
