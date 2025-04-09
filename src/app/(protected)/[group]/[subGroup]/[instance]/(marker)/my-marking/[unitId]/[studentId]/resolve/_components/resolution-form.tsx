"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Form, FormLabel } from "@/components/ui/form";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { GRADES } from "@/config/grades";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { YesNoAction } from "@/components/yes-no-action";
import { PAGES } from "@/config/pages";
import { z } from "zod";

const gradeResolutionSchema = z.object({
  grade: z.number(),
  comment: z.string().min(1),
  studentId: z.string(),
  unitOfAssessmentId: z.string(),
});

type GradeResolutionDTO = z.infer<typeof gradeResolutionSchema>;

export function ResolutionForm({
  studentId,
  unitOfAssessmentId,
}: {
  studentId: string;
  unitOfAssessmentId: string;
}) {
  const params = useInstanceParams();
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const [open, setOpen] = useState(false);
  const dropDownDefaultVal = "??";

  const { mutateAsync: resolveAsync } =
    api.user.marker.resolveMarks.useMutation();

  const form = useForm<GradeResolutionDTO>({
    resolver: zodResolver(gradeResolutionSchema),
    reValidateMode: "onBlur",
    defaultValues: { comment: "", grade: -1, studentId, unitOfAssessmentId },
  });

  const handleSubmit = form.handleSubmit((data: GradeResolutionDTO) => {
    void toast.promise(
      resolveAsync({ params, ...data }).then(() => {
        router.push(`${instancePath}/${PAGES.myMarking.href}`);
        router.refresh();
      }),
      {
        loading: `Submitting resolution for Student ${data.studentId}...`,
        error: "Something went wrong",
        success: `Successfully submitted resolution for Student ${data.studentId}`,
      },
    );
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        <FormField
          control={form.control}
          name={"grade"}
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
          control={form.control}
          name={"comment"}
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

        <div className="mt-16 flex justify-end gap-8">
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
