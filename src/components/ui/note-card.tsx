import { type ReactNode } from "react";

import { type ClassValue } from "clsx";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader } from "./card";

export function NoteCard({
  className,
  title = "Please note:",
  children: note,
}: {
  className?: ClassValue;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "border-l-[3px] border-y-transparent border-l-sky-400 border-r-transparent bg-sky-100/50",
        className,
      )}
    >
      <CardHeader className="px-3 pb-1 pt-4 text-base font-semibold text-secondary">
        {title}
      </CardHeader>
      <CardContent className="px-3 pb-4">{note}</CardContent>
    </Card>
  );
}
