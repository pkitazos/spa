"use client";
import { SubHeading } from "@/components/heading";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkerType } from "@prisma/client";
import { EditableFlag, EditableSubmission } from "./editable-text";
import { useMarkingSchemeStore } from "./state";
import { useEffect } from "react";
import { SortableForm } from "./sortable";
import { DeadlinesSection } from "./deadlines-section";

export function CentrePanel() {
  const { flags, selectedFlagIndex, selectedSubmissionIndex } =
    useMarkingSchemeStore((s) => s);

  if (
    selectedFlagIndex === undefined &&
    selectedSubmissionIndex === undefined
  ) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        Click the plus button in the sidebar to create a new flag
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
    const selectedFlag = flags[selectedFlagIndex];
    const selectedSubmission =
      selectedFlag.submissions[selectedSubmissionIndex];

    return (
      <div className="flex w-full flex-col items-center justify-start gap-10 px-10 pt-10">
        <div className="flex w-full flex-col items-start justify-center gap-10">
          <SubHeading>{selectedFlag.title}</SubHeading>
          <EditableSubmission
            component="h3"
            className="h-7 text-2xl font-medium leading-none tracking-tight"
          />
          <DeadlinesSection defaultDates={selectedSubmission} />
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
            <SortableForm activeMarkerType={MarkerType.SUPERVISOR} />
          </TabsContent>
          <TabsContent value={MarkerType.READER}>
            <SortableForm activeMarkerType={MarkerType.READER} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
}
