"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { spacesLabels } from "@/config/spaces";
import { cn } from "@/lib/utils";
import { format, isAfter } from "date-fns";
import { DateTimePicker } from "@/components/date-time-picker";
import { TimelineSequence } from "./timeline-sequence";
import { UploadJsonArea } from "./flag-json-upload";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import TagInput from "./tag-input";

const WIZARD_STEPS = [
  { id: "basic-details", title: "Basic Details" },
  { id: "flags-assessment", title: "Flags & Assessments" },
  { id: "project-tags", title: "Project Keywords" },
  { id: "deadlines", title: "Deadlines & Timeline" },
  { id: "student-preferences", title: "Student Preferences" },
  { id: "reader-preferences", title: "Reader Preferences" },
  { id: "review", title: "Review & Submit" },
];

export const flagsAssessmentSchema = z
  .array(
    z.object({
      flag: z.string(),
      description: z.string(),
      units_of_assessment: z.array(
        z.object({
          title: z.string(),
          student_submission_deadline: z.coerce.date(),
          marker_submission_deadline: z.coerce.date(),
          weight: z.number(),
          allowed_marker_types: z
            .array(
              z.union([z.literal("supervisor"), z.literal("reader")], {
                errorMap(err) {
                  if (err.code === "invalid_union") {
                    return {
                      message: "Values must be either supervisor or reader",
                    };
                  } else return { message: err.message ?? "freaky error" };
                },
              }),
            )
            .refine((arr) => arr.length === new Set(arr).size, {
              message: "no duplicate values",
            }),
          assessment_criteria: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              weight: z.number(),
            }),
          ),
        }),
      ),
    }),
  )
  .min(1);

function buildWizardSchema(takenNames: Set<string> = new Set()) {
  return z
    .object({
      // basic details
      displayName: z
        .string()
        .min(1, "Please enter a name")
        .refine((name) => !takenNames.has(name), {
          message: "This name is already taken",
        }),

      // flags and assessment
      flags: flagsAssessmentSchema,

      // project tags
      tags: z
        .array(
          z.object({ title: z.string().min(2, "Please enter a valid title") }),
        )
        .min(1, "You must provide at least one flag"),

      // deadlines
      //deadlines should validate after input
      projectSubmissionDeadline: z.date({
        required_error: "Please select a project submission deadline",
      }),

      studentPreferenceSubmissionDeadline: z.date({
        required_error:
          "Please select a student preference submission deadline",
      }),

      readerPreferenceSubmissionDeadline: z.date({
        required_error: "Please select a reader preference submission deadline",
      }),

      // student preferences
      minStudentPreferences: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),

      maxStudentPreferences: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),

      maxStudentPreferencesPerSupervisor: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),

      // reader preferences
      minReaderPreferences: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),

      maxReaderPreferences: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),
    })
    .refine(
      (data) => data.minStudentPreferences <= data.maxStudentPreferences,
      {
        message:
          "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
        path: ["maxStudentPreferences"],
      },
    )
    .refine(
      (data) =>
        data.maxStudentPreferencesPerSupervisor <= data.maxStudentPreferences,
      {
        message:
          "Maximum Number of Preferences per supervisor can't be more than Maximum Number of Preferences",
        path: ["maxStudentPreferencesPerSupervisor"],
      },
    )
    .refine((data) => data.minReaderPreferences <= data.maxReaderPreferences, {
      message:
        "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
      path: ["maxReaderPreferences"],
    })
    .refine(
      (data) => data.minStudentPreferences <= data.maxStudentPreferences,
      {
        message:
          "Maximum Number of Preferences can't be less than Minimum Number of Preferences",

        path: ["maxStudentPreferences"],
      },
    )
    .refine(
      (data) =>
        isAfter(
          data.studentPreferenceSubmissionDeadline,
          data.projectSubmissionDeadline,
        ),
      {
        message:
          "Student Preference Submission deadline must be after Project Upload deadline",
        path: ["studentPreferenceSubmissionDeadline"],
      },
    )
    .refine(
      (data) =>
        isAfter(
          data.readerPreferenceSubmissionDeadline,
          data.studentPreferenceSubmissionDeadline,
        ),
      {
        message:
          "Reader Preference Submission deadline must be after Student Preference Submission deadline",
        path: ["readerPreferenceSubmissionDeadline"],
      },
    );
}

export type WizardFormData = z.infer<ReturnType<typeof buildWizardSchema>>;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-medium",
                index < currentStep
                  ? "bg-primary text-primary-foreground" // completed
                  : index === currentStep
                    ? "border-2 border-primary text-primary" // current
                    : "border-2 border-muted text-muted-foreground", // next
              )}
            >
              {index + 1}
            </div>
            <div className="mt-1 w-16 text-center text-xs">{step.title}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-2">
        <div className="absolute top-0 h-1 w-full bg-muted" />
        <div
          className="absolute h-1 bg-primary transition-all"
          style={{
            width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

interface WizardPageProps {
  children: ReactNode;
  title: string;
  description?: string;
}

function WizardPage({ children, title, description }: WizardPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <Separator />
      <div className="py-4">{children}</div>
    </div>
  );
}

function BasicDetailsPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Basic Details"
      description="Enter the basic information for your allocation instance."
    >
      <div className="max-w-2xl space-y-6">
        <FormField
          control={control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xl">
                {spacesLabels.instance.full} Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={`${spacesLabels.instance.short} Name`}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Please select a unique name within the{" "}
                {spacesLabels.group.short} and {spacesLabels.subGroup.short} for
                this {spacesLabels.instance.short}.
                <br />
                <p className="pt-1 text-black">
                  Please note: This name{" "}
                  <span className="font-semibold underline">
                    cannot be changed
                  </span>{" "}
                  later.
                </p>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </WizardPage>
  );
}

function FlagsAssessmentPage() {
  /**
   * TODO hook up visual component (i.e. re-write with form control)
   * need to create a bridge between the store and form
   * can add an effect that syncs data between them ?
   *
   * - should initialise state using the current form values
   * - need a way to update the form when the marking scheme changes
   * - "New Flag" button should add flags to both the Zustand store and the form
   * - flag deletion must update both states
   *
   */
  return (
    <WizardPage
      title="Flags & Assessment Configuration"
      description="Configure flags to categorize students and define assessments for each flag."
    >
      <UploadJsonArea />
    </WizardPage>
  );
}

function ProjectTagsPage() {
  return (
    <WizardPage
      title="Project Keywords"
      description="Define tags that supervisors can use to label their projects."
    >
      <div className="max-w-2xl space-y-6">
        <TagInput
          label="Project Keywords"
          description="Add keywords that supervisors can use to categorise their projects. These help students find relevant projects."
          placeholder="Add a keyword and press Enter"
        />

        <div className="mt-6 rounded-md bg-muted p-4">
          <h3 className="mb-2 text-base font-medium">About Project Keywords</h3>
          <p className="text-sm text-muted-foreground">
            Keywords help organize and categorise projects. They make it easier
            for students to search and filter projects based on their interests
            and skills.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Add common technology keywords (e.g., "Machine Learning", "Web
              Development")
            </li>
            <li>Include research areas relevant to your department</li>
            <li>Include subjects students may have taken</li>
            <li>
              Consider including programming languages relevant to the project
              (e.g., "Rust", "Python", "Haskell")
            </li>
          </ul>
        </div>
      </div>
    </WizardPage>
  );
}

function DeadlinesPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Deadlines & Timeline"
      description="Set the important deadlines for your allocation instance."
    >
      <div className="flex max-w-2xl flex-col gap-8">
        <FormField
          control={control}
          name="projectSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Project Submission Deadline
              </FormLabel>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select project submission deadline"
                  label=""
                />
              </FormControl>

              <FormDescription className="mt-1">
                The deadline for supervisors to submit their projects.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="studentPreferenceSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Student Preference Submission Deadline
              </FormLabel>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select student preference deadline"
                  label=""
                />
              </FormControl>

              <FormDescription className="mt-1">
                The deadline for students to submit their preference list. This
                must be after the project submission deadline.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="readerPreferenceSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Reader Preference Submission Deadline
              </FormLabel>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select reader preference deadline"
                  label=""
                />
              </FormControl>

              <FormDescription className="mt-1">
                The deadline for readers to submit their preference list. This
                must be after the student preference submission deadline.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />
        <TimelineSequence />
      </div>
    </WizardPage>
  );
}

function StudentPreferencesPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Student Preferences"
      description="Configure settings for student project preferences."
    >
      <div className="flex max-w-2xl flex-col gap-6">
        <FormField
          control={control}
          name="minStudentPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex items-center justify-between gap-4">
                <FormLabel className="text-base">
                  Minimum number of Preferences:
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-20 text-center placeholder:text-slate-300"
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                The minimum number of preferences a student must submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="maxStudentPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex items-center justify-between gap-4">
                <FormLabel className="text-base">
                  Maximum number of Preferences:
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-20 text-center placeholder:text-slate-300"
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                The maximum number of preferences a student can submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="maxStudentPreferencesPerSupervisor"
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex items-center justify-between gap-4">
                <FormLabel className="text-base">
                  Maximum Preferences per Supervisor:
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-20 text-center placeholder:text-slate-300"
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                The maximum number of projects belonging to the same supervisor
                a student is able to select.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </WizardPage>
  );
}

function ReaderPreferencesPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Reader Preferences"
      description="Configure settings for reader project preferences."
    >
      <div className="flex max-w-2xl flex-col gap-6">
        <FormField
          control={control}
          name="minReaderPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex items-center justify-between gap-4">
                <FormLabel className="text-base">
                  Minimum number of Preferences:
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-20 text-center placeholder:text-slate-300"
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                The minimum number of preferences a reader must submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="maxReaderPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex items-center justify-between gap-4">
                <FormLabel className="text-base">
                  Maximum number of Preferences:
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-20 text-center placeholder:text-slate-300"
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                The maximum number of preferences a reader can submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </WizardPage>
  );
}

function ReviewPage() {
  const form = useFormContext<WizardFormData>();
  const formData = form.getValues();
  return (
    <WizardPage
      title="Review & Submit"
      description="Review your settings and create your allocation instance."
    >
      <div className="flex flex-col items-start justify-start gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Display Name</p>
          <p>{formData.displayName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Flags</p>
          <p>
            {formData.flags.map((f) => (
              <div key={f.flag}>
                <p className="font-semibold">{f.flag}</p>
                <p>{f.description}</p>
                <div>
                  {f.units_of_assessment.map((u) => (
                    <div key={`${f.flag}-${u.title}`} className="pl-6">
                      <p className="font-semibold">{u.title}</p>
                      <p>weight: {u.weight}</p>
                      <p>
                        allowed marker types:{" "}
                        {u.allowed_marker_types.join(", ")}
                      </p>
                      <p>
                        <span>Student Submission Deadline: </span>
                        {format(
                          u.student_submission_deadline,
                          "dd MMM yyyy - HH:mm",
                        )}
                      </p>
                      <p>
                        <span>Marker Submission Deadline: </span>
                        {format(
                          u.marker_submission_deadline,
                          "dd MMM yyyy - HH:mm",
                        )}
                      </p>
                      <div className="pl-6">
                        {u.assessment_criteria.map((c) => (
                          <div
                            className="pl-6"
                            key={`${f.flag}-${u.title}-${c.title}`}
                          >
                            <p className="font-semibold">{c.title}</p>
                            <p>{c.description}</p>
                            <p>{c.weight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((t, i) => (
              <Badge variant="accent" key={i}>
                {t.title}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Deadlines</p>
          <p>
            Project Submission:
            {format(formData.projectSubmissionDeadline, "dd MMM yyyy - HH:mm")}
          </p>
          <p>
            Student Preference Submission:
            {format(
              formData.studentPreferenceSubmissionDeadline,
              "dd MMM yyyy - HH:mm ",
            )}
          </p>
          <p>
            Reader Preference Submission:
            {format(
              formData.readerPreferenceSubmissionDeadline,
              "dd MMM yyyy - HH:mm ",
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Student Preference Restrictions
          </p>
          <p>min: {formData.minStudentPreferences}</p>
          <p>max: {formData.maxStudentPreferences}</p>
          <p>
            max per supervisor: {formData.maxStudentPreferencesPerSupervisor}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Reader Preference Restrictions
          </p>
          <p>min: {formData.minReaderPreferences}</p>
          <p>max: {formData.maxReaderPreferences}</p>
        </div>
      </div>
    </WizardPage>
  );
}

export function InstanceWizard({
  onSubmit,
  defaultValues,
  takenNames = new Set(),
}: {
  onSubmit: (data: WizardFormData) => Promise<void>;
  defaultValues: WizardFormData;
  takenNames: Set<string>;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const wizardSchema = buildWizardSchema(takenNames);

  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues,
  });

  async function handleNext() {
    if (currentStep === WIZARD_STEPS.length - 1) {
      await methods.trigger();
      if (methods.formState.isValid) {
        console.log("submitting form");
        methods.handleSubmit(async (data) => {
          console.log("hello from inside the submit function");
          return onSubmit(data);
        })();
      }
      return;
    }

    let fieldsToValidate: (keyof WizardFormData)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = ["displayName"];
        break;
      case 1:
        fieldsToValidate = ["flags"];
        break;
      case 2:
        fieldsToValidate = ["tags"];
        break;
      case 3:
        fieldsToValidate = [
          "projectSubmissionDeadline",
          "studentPreferenceSubmissionDeadline",
          "readerPreferenceSubmissionDeadline",
        ];
        break;
      case 4:
        fieldsToValidate = [
          "minStudentPreferences",
          "maxStudentPreferences",
          "maxStudentPreferencesPerSupervisor",
        ];
        break;
      case 5:
        fieldsToValidate = ["minReaderPreferences", "maxReaderPreferences"];
        break;
    }

    await methods.trigger(fieldsToValidate);

    const valid = fieldsToValidate.every(
      (val) => !methods.getFieldState(val).invalid,
    );

    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  }

  function handlePrevious() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="w-full pt-6">
            <CardContent>
              <StepIndicator currentStep={currentStep} />
              <CurrentStepContent currentStep={currentStep} />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    Previous
                  </Button>
                )}
                {currentStep === 0 && (
                  <Button type="button" size="lg" variant="outline" asChild>
                    <Link href="./settings">Cancel</Link>
                  </Button>
                )}
              </div>
              <Button type="button" onClick={handleNext}>
                {currentStep === WIZARD_STEPS.length - 1 ? "Submit" : "Next"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </FormProvider>
  );
}

function CurrentStepContent({ currentStep }: { currentStep: number }) {
  switch (currentStep) {
    case 0:
      return <BasicDetailsPage />;
    case 1:
      return <FlagsAssessmentPage />;
    case 2:
      return <ProjectTagsPage />;
    case 3:
      return <DeadlinesPage />;
    case 4:
      return <StudentPreferencesPage />;
    case 5:
      return <ReaderPreferencesPage />;
    case 6:
      return <ReviewPage />;
    default:
      return <div>Unknown step</div>;
  }
}
