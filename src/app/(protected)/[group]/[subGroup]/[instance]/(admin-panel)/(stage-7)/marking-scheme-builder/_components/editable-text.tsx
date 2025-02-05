"use client";
import { Check, Pen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { WithTooltip } from "@/components/ui/tooltip-wrapper";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/general/slugify";
import { FlagMarkingScheme, FlagSubmission } from "./store";

type EditableTextProps = {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  component?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
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
              "bg-transparent focus:outline-none",
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

type URLAwareEditableTextProps = EditableTextProps & {
  urlParamKey: string;
  otherParams?: Record<string, string | undefined>;
};

export function URLAwareEditableText({
  initialValue,
  onSave,
  urlParamKey,
  otherParams = {},
  ...props
}: URLAwareEditableTextProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSave(newValue: string) {
    onSave(newValue);

    const params = new URLSearchParams(searchParams.toString());

    params.set(urlParamKey, slugify(newValue));

    Object.entries(otherParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value);
      }
    });

    router.push(`?${params.toString()}`);
  }

  return (
    <EditableText initialValue={initialValue} onSave={handleSave} {...props} />
  );
}

export function EditableFlag({
  flagIndex,
  flag,
  onSave,
  ...props
}: {
  flagIndex: number;
  flag: FlagMarkingScheme;
  onSave: (value: string) => void;
  [key: string]: any;
}) {
  return (
    <URLAwareEditableText
      initialValue={flag.title}
      onSave={onSave}
      urlParamKey="flag"
      {...props}
    />
  );
}

export function EditableSubmission({
  flagIndex,
  submissionIndex,
  flag,
  submission,
  onSave,
  ...props
}: {
  flagIndex: number;
  submissionIndex: number;
  flag: FlagMarkingScheme;
  submission: FlagSubmission;
  onSave: (value: string) => void;
  [key: string]: any;
}) {
  console.log("EditableSubmission:", submission.title);
  return (
    <URLAwareEditableText
      initialValue={submission.title}
      onSave={onSave}
      urlParamKey="submission"
      otherParams={{ flag: slugify(flag.title) }}
      {...props}
    />
  );
}
