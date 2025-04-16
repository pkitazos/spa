"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Form, FormDescription, FormLabel } from "@/components/ui/form";
import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import {
  FormControl,
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
  PartialMarkingSubmissionDTO,
  MarkingSubmissionDTO,
  markingSubmissionDtoSchema,
} from "@/dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { Control, useForm } from "react-hook-form";
import { Grade, GRADES } from "@/config/grades";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { YesNoAction } from "@/components/yes-no-action";
import { PAGES } from "@/config/pages";

export function MarkingSection({
  markingCriteria,
  initialState,
}: {
  markingCriteria: AssessmentCriterionDTO[];
  initialState: PartialMarkingSubmissionDTO;
}) {
  const params = useInstanceParams();
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: saveAsync } = api.user.marker.saveMarks.useMutation();
  const { mutateAsync: submitAsync } =
    api.user.marker.submitMarks.useMutation();

  const form = useForm<MarkingSubmissionDTO>({
    resolver: zodResolver(markingSubmissionDtoSchema),
    reValidateMode: "onBlur",
    defaultValues: {
      ...initialState,
      marks: markingCriteria.reduce(
        (acc, val) => {
          const data = initialState.marks?.[val.id];
          return {
            ...acc,
            [val.id]: {
              mark: data?.mark ?? -1,
              justification: data?.justification ?? "",
            },
          };
        },
        {} as Record<string, { mark: number; justification: string }>,
      ),
    },
  });

  function handleSave(data: PartialMarkingSubmissionDTO) {
    void toast.promise(
      saveAsync({ params, ...data }).then(() => {
        console.log(data.recommendation, "-", data.finalComment);
        router.push(`${instancePath}/${PAGES.myMarking.href}`);
        router.refresh();
      }),
      {
        loading: `Saving marks for Student ${data.studentId}...`,
        error: "Something went wrong",
        success: `Successfully saved marks for Student ${data.studentId}`,
      },
    );
  }

  const handleSubmit = form.handleSubmit((data: MarkingSubmissionDTO) => {
    void toast.promise(
      submitAsync({ params, ...data }).then(() => {
        router.push(`${instancePath}/${PAGES.myMarking.href}`);
        router.refresh();
      }),
      {
        loading: `Submitting marks for Student ${data.studentId}...`,
        error: "Something went wrong",
        success: `Successfully submitted marks for Student ${data.studentId}`,
      },
    );
  });

  const grade = form.watch("grade");

  function formatGrade(grade: number) {
    if (grade !== -1) return Grade.toLetter(grade);
    else return "-";
  }

  const computeOverallGrade = useCallback(() => {
    const marks = form.getValues("marks");
    if (!markingCriteria.every((c) => marks[c.id].mark !== -1)) return;

    console.log("hello!");

    const scores: { score: number; weight: number }[] = markingCriteria.map(
      (c) => ({ weight: c.weight, score: marks[c.id].mark }),
    );

    const grade = Grade.computeFromScores(scores);

    form.setValue("grade", grade, { shouldValidate: true });
  }, [form, markingCriteria]);

  useEffect(computeOverallGrade, [computeOverallGrade]);

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        <div className="flex flex-col gap-20">
          {markingCriteria.map((criterion) => (
            <AssessmentCriterionField
              key={criterion.id}
              criterion={criterion}
              control={form.control}
              computeOverallGrade={computeOverallGrade}
            />
          ))}
        </div>
        <div>
          <h3>overall mark:</h3>
          <h4>{formatGrade(grade)}</h4>
        </div>
        {markingCriteria.length > 1 ? (
          <FormField
            control={form.control}
            name="finalComment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary</FormLabel>
                <FormDescription>
                  A short summary of your evaluation or additional comments
                </FormDescription>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        ) : (
          <Fragment />
        )}

        <div className="mt-16 flex justify-end gap-8">
          <Button
            onClick={() => handleSave(form.getValues())}
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
              <Button type="button" size="lg">
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
  computeOverallGrade,
}: {
  criterion: AssessmentCriterionDTO;
  control: Control<MarkingSubmissionDTO>;
  computeOverallGrade: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropDownDefaultVal = "??";

  return (
    <div className="flex flex-col gap-2" key={criterion.id}>
      <p className="text-lg font-semibold text-primary">{criterion.title}</p>
      <p>{criterion.description}</p>
      <div className="mt-2 flex flex-row gap-4">
        <FormField
          control={control}
          name={`marks.${criterion.id}.mark`}
          render={({ field }) => {
            const hasGrade = field.value !== -1;

            return (
              <FormItem className="flex w-32 flex-col gap-1">
                <FormLabel className="text-muted-foreground">Grade</FormLabel>
                <FormControl>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                          "justify-between text-muted-foreground",
                          hasGrade && "text-foreground",
                        )}
                      >
                        <span>
                          {hasGrade
                            ? (GRADES.find(
                                (grade) => grade.value === field.value,
                              )?.label ?? dropDownDefaultVal)
                            : dropDownDefaultVal}
                        </span>
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
                                  computeOverallGrade();
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
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          key={criterion.id}
          control={control}
          name={`marks.${criterion.id}.justification`}
          render={({ field }) => (
            <FormItem className="flex w-full flex-col gap-1">
              <FormLabel className="text-muted-foreground">
                Justification
              </FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
