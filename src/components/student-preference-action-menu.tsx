"use client";

import { useState } from "react";

import { BookmarkIcon } from "lucide-react";

import { PreferenceType } from "@/db/types";

import {
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

import {
  studentPreferenceSchema,
  type StudentPreferenceType,
} from "@/lib/validations/student-preference";

export function StudentPreferenceActionSubMenu({
  defaultType,
  changePreference,
}: {
  defaultType?: StudentPreferenceType;
  changePreference: (newPreference: StudentPreferenceType) => Promise<void>;
}) {
  const [preferenceType, setPreferenceType] = useState<
    StudentPreferenceType | undefined
  >(defaultType);

  async function handleChange(value: string) {
    const preferenceChange = studentPreferenceSchema.parse(value);
    await changePreference(preferenceChange);
    setPreferenceType(preferenceChange);
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center gap-2 text-primary">
        <BookmarkIcon className="size-4" />
        <span>Change preference type to</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={preferenceType}
            onValueChange={handleChange}
          >
            <DropdownMenuRadioItem value={PreferenceType.SHORTLIST}>
              Shortlist
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={PreferenceType.PREFERENCE}>
              Preference
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="None">None</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
