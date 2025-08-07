"use client";

import { useState } from "react";

import { type ClassValue } from "clsx";
import { BookmarkIcon } from "lucide-react";

import { PreferenceType } from "@/db/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import {
  studentPreferenceSchema,
  type StudentPreferenceType,
} from "@/lib/validations/student-preference";

export function ChangePreferenceButton({
  buttonLabelType = "static",
  dropdownLabel = "Save Project in:",
  defaultStatus,
  changeFunction,
  className,
}: {
  buttonLabelType?: "static" | "dynamic";
  dropdownLabel?: string;
  defaultStatus: StudentPreferenceType;
  changeFunction: (newPreferenceType: StudentPreferenceType) => Promise<void>;
  className?: ClassValue;
}) {
  const [selectStatus, setSelectStatus] =
    useState<StudentPreferenceType>(defaultStatus);

  async function handleChange(value: string) {
    const preferenceChange = studentPreferenceSchema.parse(value);
    await changeFunction(preferenceChange);
    setSelectStatus(preferenceChange);
  }

  const buttonLabel =
    buttonLabelType === "static" ? (
      <div className="flex items-center gap-2">
        <BookmarkIcon className="h-5 w-5" />
        <span className="text-start text-xs">Change Type</span>
      </div>
    ) : selectStatus === PreferenceType.PREFERENCE ? (
      "In Preferences"
    ) : selectStatus === PreferenceType.SHORTLIST ? (
      "In Shortlist"
    ) : (
      "Select"
    );

  // TODO: add icon to action button
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className={cn(className, "min-w-32 text-nowrap")}
          >
            {buttonLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>{dropdownLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectStatus}
            onValueChange={handleChange}
          >
            <DropdownMenuRadioItem value="None">None</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={PreferenceType.SHORTLIST}>
              Shortlist
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={PreferenceType.PREFERENCE}>
              Preference
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
