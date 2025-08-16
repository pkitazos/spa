"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

import { Check, Pen } from "lucide-react";

import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";

import { useMarkingSchemeStore } from "./state";
import { useUpdateQueryParams } from "./use-update-query-params";

type EditableTextProps = {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  component?: keyof JSX.IntrinsicElements;
  inputClassName?: string;
};

export function EditableText({
  initialValue,
  onSave,
  className = "",
  component = "span",
  inputClassName = "",
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  function handleSave() {
    setIsEditing(false);
    onSave(value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setValue(initialValue);
      setIsEditing(false);
    }
  }

  const Comp = component;

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "bg-transparent focus:outline-hidden",
              className,
              inputClassName,
            )}
          />
          <WithTooltip tip="Save text">
            <button
              onClick={handleSave}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <Check className="h-4 w-4 text-green-600" />
            </button>
          </WithTooltip>
        </>
      ) : (
        <>
          <Comp className={cn("grid place-items-center", className)}>
            {value}
          </Comp>
          <WithTooltip tip="Edit text">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <Pen className="h-4 w-4 text-gray-600" />
            </button>
          </WithTooltip>
        </>
      )}
    </div>
  );
}

export function EditableFlag(props: {
  className?: string;
  component?: keyof JSX.IntrinsicElements;
  inputClassName?: string;
}) {
  const updateQueryParams = useUpdateQueryParams();
  const {
    flags,
    selectedFlagIndex: flagIdx,
    updateFlag,
  } = useMarkingSchemeStore((s) => s);

  if (flagIdx === undefined) throw new Error("No Flag");

  const flag = useMemo(() => flags[flagIdx], [flags, flagIdx]);

  const handleRenameFlag = useCallback(
    (value: string) => {
      if (flagIdx === undefined) throw new Error("No Flag");
      const newFlag = { ...flag, title: value };
      updateFlag(flagIdx, newFlag);
      updateQueryParams(value, undefined);
    },
    [flagIdx, flag, updateFlag, updateQueryParams],
  );

  return (
    <EditableText
      initialValue={flag.title}
      onSave={handleRenameFlag}
      {...props}
    />
  );
}

export function EditableSubmission(props: {
  className?: string;
  component?: keyof JSX.IntrinsicElements;
  inputClassName?: string;
}) {
  const updateQueryParams = useUpdateQueryParams();
  const {
    flags,
    selectedFlagIndex: flagIdx,
    selectedSubmissionIndex: submissionIdx,
    updateSubmission,
  } = useMarkingSchemeStore((s) => s);

  if (flagIdx === undefined) throw new Error("No Flag");
  if (submissionIdx === undefined) throw new Error("No Submission");

  const submission = flags[flagIdx].submissions[submissionIdx];

  function handleRenameSubmission(value: string) {
    if (flagIdx === undefined) throw new Error("No Flag");
    if (submissionIdx === undefined) throw new Error("No Submission");

    const selectedFlag = flags[flagIdx];
    const newSubmission = {
      ...selectedFlag.submissions[submissionIdx],
      title: value,
    };

    updateSubmission(flagIdx, submissionIdx, newSubmission);
    updateQueryParams(selectedFlag.title, newSubmission.title);
  }

  return (
    <EditableText
      initialValue={submission.title}
      onSave={handleRenameSubmission}
      {...props}
    />
  );
}
