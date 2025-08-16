"use client";

import { PenIcon } from "lucide-react";
import Link from "next/link";

import { PAGES } from "@/config/pages";

import { Stage } from "@/db/types";

import { ConditionalRender } from "@/components/access-control";
import { FormatDenials } from "@/components/access-control/format-denial";
import { usePathInInstance } from "@/components/params-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";

export function EditButton({ studentId }: { studentId: string }) {
  const { getInstancePath } = usePathInInstance();

  return (
    <ConditionalRender
      allowedStages={[Stage.STUDENT_BIDDING]}
      allowed={
        <Link
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex items-center justify-center gap-2 text-nowrap",
          )}
          href={getInstancePath([
            PAGES.allStudents.href,
            studentId,
            PAGES.studentPreferences.href,
          ])}
        >
          <PenIcon className="h-4 w-4" />
          <p>Edit Student Preferences</p>
        </Link>
      }
      denied={(denialData) => (
        <WithTooltip
          tip={
            <FormatDenials
              {...denialData}
              action="Updating student preferences"
            />
          }
          forDisabled
        >
          <Button
            disabled
            variant="outline"
            className={cn("flex items-center justify-center gap-2 text-nowrap")}
          >
            <PenIcon className="h-4 w-4" />
            <p>Edit Student Preferences</p>
          </Button>
        </WithTooltip>
      )}
    />
  );
}
