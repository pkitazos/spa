"use client";

import { PenIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SubHeading } from "@/components/heading";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { NewFlagForm } from "./new-flag-form";
import { useSelectedFlag, useSelectedSubmission } from "./store";

export function MainContentPanel({ newFlag }: { newFlag: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const editMode = searchParams.get("edit") ?? false;

  const selectedFlag = useSelectedFlag();
  const selectedSubmission = useSelectedSubmission();

  function changeEditMode(newMode: boolean) {
    if (!newMode) router.push(pathname);
    else router.push(`${pathname}?edit=true`);
  }

  if (newFlag) return <NewFlagForm />;

  if (!selectedFlag && !selectedSubmission) {
    return <div>Select a flag or create a new one</div>;
  }

  if (selectedSubmission) {
    return (
      <div>
        <WithTooltip tip="Edit Submission Title">
          <button
            className="flex items-center gap-3 "
            onClick={() => changeEditMode(!editMode)}
          >
            <SubHeading>{selectedSubmission.title}</SubHeading>
            <PenIcon className="h-4 w-4" />
          </button>
        </WithTooltip>
        <p>
          {selectedSubmission.components
            ? selectedSubmission.components.SUPERVISOR.map((component, i) => (
                <div key={i}>
                  <p>{component.name}</p>
                  <p>{component.description}</p>
                </div>
              ))
            : "No components provided"}
        </p>
      </div>
    );
  }

  if (selectedFlag) {
    return (
      <div>
        <SubHeading>{selectedFlag.title}</SubHeading>
        <p>
          {selectedFlag.description
            ? selectedFlag.description
            : "No description provided"}
        </p>
      </div>
    );
  }
}
