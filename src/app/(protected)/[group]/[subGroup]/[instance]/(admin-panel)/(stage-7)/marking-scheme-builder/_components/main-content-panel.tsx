"use client";

import { PenIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SectionHeading, SubHeading } from "@/components/heading";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import {
  useMarkingSchemeStore,
  useSelectedFlag,
  useSelectedSubmission,
} from "./store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkerType } from "@prisma/client";
import {
  EditableFlag,
  EditableSubmission,
  EditableText,
} from "./editable-text";

export function MainContentPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const flags = useMarkingSchemeStore((s) => s.flags);
  const updateFlag = useMarkingSchemeStore((s) => s.updateFlag);
  const setFlags = useMarkingSchemeStore((s) => s.setFlags);
  const selectedFlagIdx = useMarkingSchemeStore((s) => s.selectedFlagIndex);

  const updateSubmission = useMarkingSchemeStore((s) => s.updateSubmission);
  const selectedSubmissionIdx = useMarkingSchemeStore(
    (s) => s.selectedSubmissionIndex,
  );

  function handleRenameFlag(value: string) {
    if (selectedFlagIdx === null) throw new Error("No Flag");
    const newFlag = { ...flags[selectedFlagIdx], title: value };
    const updatedFlags = insertOrReplace(flags, newFlag, selectedFlagIdx);
    console.log({ flags, updatedFlags });
    setFlags(updatedFlags);
  }

  function handleRenameSubmission(value: string) {
    if (selectedFlagIdx === null) throw new Error("No Flag");
    if (selectedSubmissionIdx === null) throw new Error("No Submission");

    const newSubmission = {
      ...flags[selectedFlagIdx].submissions[selectedSubmissionIdx],
      title: value,
    };
    const updatedSubmissions = insertOrReplace(
      flags[selectedFlagIdx].submissions,
      newSubmission,
      selectedSubmissionIdx,
    );

    const newFlag = {
      ...flags[selectedFlagIdx],
      submissions: updatedSubmissions,
    };
    const updatedFlags = insertOrReplace(flags, newFlag, selectedFlagIdx);
    console.log({ flags, updatedFlags });
    setFlags(updatedFlags);
  }

  const newFlag = searchParams.get("flag");

  const selectedFlag = useSelectedFlag();
  const selectedSubmission = useSelectedSubmission();

  if (!selectedFlag && !selectedSubmission && !newFlag) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <h2 className="text-3xl text-cyan-500">AAAAAAAAAA!!</h2>
        Select a flag or create a new one
      </div>
    );
  }

  if (
    selectedSubmission &&
    selectedFlag &&
    selectedFlagIdx !== null &&
    selectedSubmissionIdx !== null
  ) {
    console.log("--->", { selectedFlag, selectedSubmission });
    return (
      <div className="flex w-full flex-col items-center justify-start gap-10 px-10 pt-10">
        <div className="flex w-full flex-col items-start justify-center gap-7">
          <SubHeading>{selectedFlag.title}</SubHeading>
          <EditableSubmission
            flagIndex={selectedFlagIdx}
            submissionIndex={selectedSubmissionIdx}
            flag={selectedFlag}
            submission={selectedSubmission}
            onSave={handleRenameSubmission}
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

  if (selectedFlag && selectedFlagIdx !== null) {
    return (
      <div className="flex w-full flex-col items-center justify-start gap-10 px-10 pt-10">
        <div className="flex w-full flex-col items-start justify-center gap-7">
          <EditableFlag
            flagIndex={selectedFlagIdx}
            flag={selectedFlag}
            onSave={handleRenameFlag}
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
}

function insertOrReplace<T>(arr: T[], element: T, index: number): T[] {
  if (index < 0) throw new Error("Index can't be negative");

  const newArr = [...arr];

  if (index >= newArr.length) newArr.push(element);
  else newArr[index] = element;

  return newArr;
}
