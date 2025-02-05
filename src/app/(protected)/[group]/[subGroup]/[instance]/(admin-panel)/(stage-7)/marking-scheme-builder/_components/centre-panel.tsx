"use client";
import { SubHeading } from "@/components/heading";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkerType } from "@prisma/client";
import { EditableFlag, EditableSubmission } from "./editable-text";
import { useMarkingSchemeStore } from "./state";
import { useEffect } from "react";

export function CentrePanel() {
  const { flags, selectedFlagIndex, selectedSubmissionIndex } =
    useMarkingSchemeStore((s) => s);

  if (
    selectedFlagIndex === undefined &&
    selectedSubmissionIndex === undefined
  ) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <h2 className="text-3xl text-sky-500">AAAAAAAAAA!!</h2>
        Select a flag or create a new one
      </div>
    );
  }

  if (
    selectedFlagIndex !== undefined &&
    selectedSubmissionIndex === undefined
  ) {
    const selectedFlag = flags[selectedFlagIndex];

    return (
      <div className="flex w-full flex-col items-center justify-start gap-10 px-10 pt-10">
        <div className="flex w-full flex-col items-start justify-center gap-7">
          <EditableFlag
            component="h2"
            className="h-9 text-3xl font-medium leading-none tracking-tight underline decoration-secondary underline-offset-4"
          />
        </div>
        <p>
          {selectedFlag.description
            ? selectedFlag.description
            : "No description provided"}
        </p>
      </div>
    );
  }

  if (
    selectedSubmissionIndex !== undefined &&
    selectedFlagIndex !== undefined
  ) {
    console.log("hello from c");
    const selectedFlag = flags[selectedFlagIndex];
    const selectedSubmission =
      selectedFlag.submissions[selectedSubmissionIndex];

    return (
      <div className="flex w-full flex-col items-center justify-start gap-10 px-10 pt-10">
        <div className="flex w-full flex-col items-start justify-center gap-7">
          <SubHeading>{selectedFlag.title}</SubHeading>
          <EditableSubmission
            component="h3"
            className="h-7 text-2xl font-medium leading-none tracking-tight"
          />

          <div className="flex flex-col gap-2">
            <p>
              Student Submission Deadline:{" "}
              {selectedSubmission.studentSubmissionDeadline.toLocaleDateString()}
            </p>
            <p>
              Marker Submission Deadline:{" "}
              {selectedSubmission.studentSubmissionDeadline.toLocaleDateString()}
            </p>
          </div>
        </div>

        <Tabs defaultValue={MarkerType.SUPERVISOR} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger className="w-full" value={MarkerType.SUPERVISOR}>
              Supervisor
            </TabsTrigger>
            <TabsTrigger className="w-full" value={MarkerType.READER}>
              Reader
            </TabsTrigger>
          </TabsList>
          <TabsContent value={MarkerType.SUPERVISOR}>
            <p>
              {selectedSubmission.components.SUPERVISOR.length > 0
                ? selectedSubmission.components.SUPERVISOR.map(
                    (component, i) => (
                      <div key={i}>
                        <p>{component.name}</p>
                        <p>{component.description}</p>
                      </div>
                    ),
                  )
                : "No components provided"}
            </p>
          </TabsContent>
          <TabsContent value={MarkerType.READER}>
            <p>
              {selectedSubmission.components.READER.length > 0
                ? selectedSubmission.components.READER.map((component, i) => (
                    <div key={i}>
                      <p>{component.name}</p>
                      <p>{component.description}</p>
                    </div>
                  ))
                : "No components provided"}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
}

function insertOrReplace<T>(arr: T[], element: T, index: number): T[] {
  if (index < 0) throw new Error("Index can't be negative");

  const newArr = [...arr];

  if (index >= newArr.length) newArr.push(element);
  else newArr[index] = element;

  return newArr;
}
