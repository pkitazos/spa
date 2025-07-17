"use client";

import { type ClassValue } from "clsx";

import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils/general/copy-to-clipboard";

import { buttonVariants } from "./ui/button";

export function CopyEmailLink({
  email,
  className,
}: {
  email: string;
  className?: ClassValue;
}) {
  return (
    <button
      onClick={() => copyToClipboard(email)}
      className={cn(buttonVariants({ variant: "link" }), "p-0", className)}
    >
      {email}
    </button>
  );
}
