"use client";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InstanceParams } from "@/lib/validations/params";

const WIZARD_STEPS = [
  { id: "basic-details", title: "Basic Details" },
  { id: "flags-assessment", title: "Flags & Assessment" },
  { id: "project-tags", title: "Project Keywords" },
  { id: "deadlines", title: "Deadlines & Timeline" },
  { id: "student-preferences", title: "Student Preferences" },
  { id: "reader-preferences", title: "Reader Preferences" },
  { id: "review", title: "Review & Submit" },
];

const wizardSchema = z.object({ displayName: z.string().optional() });

type WizardFormData = z.infer<typeof wizardSchema>;

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
                  ? "bg-primary text-primary-foreground" // Completed
                  : index === currentStep
                    ? "border-2 border-primary text-primary" // Current
                    : "border-2 border-muted text-muted-foreground", // Upcoming
              )}
            >
              {index + 1}
            </div>
            <div className="mt-1 w-16 text-center text-xs">{step.title}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-2">
        <div className="absolute top-0 h-1 w-full bg-muted"></div>
        <div
          className="absolute h-1 bg-primary transition-all"
          style={{
            width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

interface WizardPageProps {
  children: ReactNode;
  title: string;
  description?: string;
}

// Reusable wrapper for wizard pages
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

// Page content components - these are just placeholders
function BasicDetailsPage() {
  return (
    <WizardPage
      title="Basic Details"
      description="Enter the basic information for your allocation instance."
    >
      <div className="py-8 text-center text-muted-foreground">
        [Instance name field will go here]
      </div>
    </WizardPage>
  );
}

function FlagsAssessmentPage() {
  return (
    <WizardPage
      title="Flags & Assessment Configuration"
      description="Configure flags to categorize students and define assessments for each flag."
    >
      <div className="py-8 text-center text-muted-foreground">
        [Flags and assessment configuration will go here]
      </div>
    </WizardPage>
  );
}

function ProjectTagsPage() {
  return (
    <WizardPage
      title="Project Keywords"
      description="Define tags that supervisors can use to label their projects."
    >
      <div className="py-8 text-center text-muted-foreground">
        [Project tags/keywords fields will go here]
      </div>
    </WizardPage>
  );
}

function DeadlinesPage() {
  return (
    <WizardPage
      title="Deadlines & Timeline"
      description="Set the important deadlines for your allocation instance."
    >
      <div className="py-8 text-center text-muted-foreground">
        [Deadline selection fields will go here]
      </div>
    </WizardPage>
  );
}

function StudentPreferencesPage() {
  return (
    <WizardPage
      title="Student Preferences"
      description="Configure settings for student project preferences."
    >
      <div className="py-8 text-center text-muted-foreground">
        [Student preference settings will go here]
      </div>
    </WizardPage>
  );
}

function ReaderPreferencesPage() {
  return (
    <WizardPage
      title="Reader Preferences"
      description="Configure settings for reader project preferences."
    >
      <div className="py-8 text-center text-muted-foreground">
        [Reader preference settings will go here]
      </div>
    </WizardPage>
  );
}

function ReviewPage() {
  return (
    <WizardPage
      title="Review & Submit"
      description="Review your settings and create your allocation instance."
    >
      <div className="py-8 text-center text-muted-foreground">
        [Summary of all settings will go here]
      </div>
    </WizardPage>
  );
}

// Main wizard component
interface InstanceWizardProps {
  onSubmit: (data: WizardFormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<WizardFormData>;
}

export function InstanceWizard({
  onSubmit,
  onCancel,
  defaultValues = {},
}: InstanceWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Set up form with react-hook-form
  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues,
    mode: "onChange",
  });

  // Handle next step
  const handleNext = async () => {
    // For the last step, submit the form
    if (currentStep === WIZARD_STEPS.length - 1) {
      const result = await methods.trigger();
      if (result) {
        await onSubmit(methods.getValues());
      }
      return;
    }

    // Validate current step before proceeding
    const result = await methods.trigger();
    if (result) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Render the current step content
  const renderStepContent = () => {
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
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Allocation Instance</CardTitle>
          </CardHeader>
          <CardContent>
            <StepIndicator currentStep={currentStep} />
            {renderStepContent()}
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
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            <Button type="button" onClick={handleNext}>
              {currentStep === WIZARD_STEPS.length - 1 ? "Submit" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}

// Create wrapper component to handle API calls and navigation
export function CreateInstanceWizard({
  params,
  takenNames,
}: {
  params: any; // Replace with your actual params type
  takenNames: Set<string>;
}) {
  const router = useRouter();

  const handleSubmit = async (data: WizardFormData) => {
    // This will be replaced with your actual API call
    console.log("Form submitted with:", data);
    // Navigate away after submission
    // router.push("/success-page");
    toast.success("Instance created successfully");
  };

  const handleCancel = () => {
    router.back();
  };

  return <InstanceWizard onSubmit={handleSubmit} onCancel={handleCancel} />;
}

// Edit wrapper component to handle API calls and navigation
export function EditInstanceWizard({
  params,
  formDetails,
  isForked,
}: {
  params: InstanceParams;
  formDetails: any; // replace with appropriate DTO
  isForked: boolean;
}) {
  const router = useRouter();

  const handleSubmit = async (data: WizardFormData) => {
    // This will be replaced with your actual API call
    console.log("Form updated with:", data);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <InstanceWizard
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      defaultValues={formDetails?.instanceData}
    />
  );
}
