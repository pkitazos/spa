"use client";

import { type ClassValue } from "clsx";
import { Trash2Icon } from "lucide-react";

import { Card, CardContent, CardDescription } from "@/components/ui/card";

import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import {
  DestructiveAction,
  DestructiveActionCancel,
  DestructiveActionConfirm,
  DestructiveActionContent,
  DestructiveActionDescription,
  DestructiveActionFooter,
  DestructiveActionHeader,
  DestructiveActionTitle,
  DestructiveActionTrigger,
  DestructiveActionVerificationTypeIn,
} from "./ui/destructive-action";
import { Label } from "./ui/label";

import { SectionHeading } from "./heading";

export function DangerZone({
  spaceLabel,
  additionalDescription,
  name,
  action,
  className,
}: {
  spaceLabel: string;
  name: string;
  additionalDescription?: string;
  action: () => void;
  className?: ClassValue;
}) {
  return (
    <section className="flex w-full flex-col gap-6">
      <SectionHeading
        icon={Trash2Icon}
        iconClassName="text-destructive"
        className="mb-2"
      >
        Danger Zone
      </SectionHeading>
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-between gap-5 pt-6">
          <CardDescription className="text-base text-muted-foreground">
            <p>
              {additionalDescription && <span>{additionalDescription} </span>}
              Once you delete an {spaceLabel}, there is no going back.
            </p>
          </CardDescription>
          <DestructiveAction action={action} requiresVerification>
            <DestructiveActionTrigger>
              <Button variant="destructive" size="lg">
                Delete {spaceLabel}
              </Button>
            </DestructiveActionTrigger>
            <DestructiveActionContent>
              <DestructiveActionHeader>
                <DestructiveActionTitle>
                  Are you absolutely sure?
                </DestructiveActionTitle>
                <DestructiveActionDescription>
                  This action cannot be undone. This will permanently delete
                  this {spaceLabel} and all related data.
                </DestructiveActionDescription>
              </DestructiveActionHeader>
              <Label>Please type the {spaceLabel} name to confirm: </Label>
              <DestructiveActionVerificationTypeIn phrase={`${name}`} />
              <DestructiveActionFooter>
                <DestructiveActionCancel asChild>
                  <Button className="w-28">Cancel</Button>
                </DestructiveActionCancel>
                <DestructiveActionConfirm asChild>
                  <Button className="w-28" variant="destructive">
                    Yes, delete
                  </Button>
                </DestructiveActionConfirm>
              </DestructiveActionFooter>
            </DestructiveActionContent>
          </DestructiveAction>
        </CardContent>
      </Card>
    </section>
  );
}
