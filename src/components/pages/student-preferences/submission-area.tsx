"use client";

import { useState } from "react";

import { format } from "date-fns";
import { AlertCircleIcon, ClockIcon } from "lucide-react";
import { toast } from "sonner";

import { PreferenceType } from "@/db/types";

import { getSubmissionErrors } from "@/components/pages/student-preferences/get-submission-errors";
import { useInstanceParams } from "@/components/params-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

import { api } from "@/lib/trpc/client";
import { type PreferenceBoard } from "@/lib/validations/board";

export function SubmissionArea({
  title,
  studentId,
  initialProjects,
  latestSubmissionDateTime,
  restrictions,
}: {
  title: string;
  studentId: string;
  initialProjects: PreferenceBoard;
  latestSubmissionDateTime: Date | undefined;
  restrictions: {
    minPreferences: number;
    maxPreferences: number;
    maxPreferencesPerSupervisor: number;
  };
}) {
  const params = useInstanceParams();

  const [submissionDate, setSubmissionDate] = useState<Date | undefined>(
    latestSubmissionDateTime,
  );

  const preferenceList = initialProjects[PreferenceType.PREFERENCE];

  const { isOver, isUnder, hasOverSelectedSupervisor, overSelected } =
    getSubmissionErrors(preferenceList, restrictions);

  const utils = api.useUtils();

  async function invalidateLatestSubmission() {
    return utils.user.student.preference.getAllSaved.invalidate();
  }

  const { mutateAsync: submitAsync } =
    api.user.student.preference.submit.useMutation();

  async function handleSubmission() {
    void toast.promise(
      submitAsync({ params, studentId }).then(async (date) => {
        await invalidateLatestSubmission();
        setSubmissionDate(date);
      }),
      {
        loading: "Submitting preference list...",
        error: "Something went wrong",
        success: "Submitted preference list",
      },
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium">{title}</CardTitle>
          <Button
            disabled={isOver || isUnder || hasOverSelectedSupervisor}
            variant="secondary"
            size="lg"
            onClick={handleSubmission}
          >
            {submissionDate ? "Update Submission" : "Submit"}
          </Button>
        </CardHeader>
      </Card>
      {submissionDate && (
        <div className="flex w-full items-center justify-end p-3">
          <ClockIcon className="mr-1 h-4 w-4 text-muted-foreground" />
          <p className="text-lg ">
            <span className="text-muted-foreground">Last submitted at:</span>{" "}
            {format(submissionDate, "dd/MM/yyyy - HH:mm")}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {isUnder && (
          <Alert variant="destructive" className="border-2 bg-destructive/10">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle className="text-lg">
              Not enough projects selected
            </AlertTitle>
            <AlertDescription className="text-base">
              You need to have at least {restrictions.minPreferences} projects
              in your preference list.
            </AlertDescription>
          </Alert>
        )}
        {isOver && (
          <Alert variant="destructive" className="border-2 bg-destructive/10">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle className="text-lg">
              Too many projects selected
            </AlertTitle>
            <AlertDescription className="text-base">
              You need to have at most {restrictions.maxPreferences} projects in
              your preference list.
            </AlertDescription>
          </Alert>
        )}
        {overSelected.map((s) => (
          <Alert
            key={s.id}
            variant="destructive"
            className="border-2 bg-destructive/10"
          >
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle className="text-lg">
              Over-Selected Supervisor
            </AlertTitle>
            <AlertDescription className="text-base">
              Currently have {s.count} projects by Supervisor{" "}
              <span className="font-bold">{s.name}</span> in your preference
              list. The maximum number per supervisor is{" "}
              {restrictions.maxPreferencesPerSupervisor}.
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </>
  );
}
