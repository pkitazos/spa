"use client";

import { type ClassValue } from "clsx";
import { CopyIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils/general/copy-to-clipboard";

import { Button } from "./ui/button";

export function CopyEmailsButton<T extends { email: string }>({
  label = "Copy Emails",
  data,
  className,
  unstyled = false,
}: {
  label?: string;
  data: T[];
  className?: ClassValue;
  unstyled?: boolean;
}) {
  const emails = data.map((d) => d.email).join(", ");
  if (unstyled) {
    return (
      <button
        className={cn(className)}
        disabled={data.length === 0}
        onClick={async () =>
          await copyToClipboard(emails, `${data.length} emails`)
        }
      >
        <CopyIcon className="mr-2 h-4 w-4" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Button
      className={cn(className)}
      disabled={data.length === 0}
      variant="outline"
      onClick={async () =>
        await copyToClipboard(emails, `${data.length} emails`)
      }
    >
      <CopyIcon className="mr-2 h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
