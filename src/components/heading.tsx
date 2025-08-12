import { type ReactNode } from "react";

import { type ClassValue } from "clsx";

import { cn } from "@/lib/utils";

export function Heading({
  className,
  children: title,
}: {
  className?: ClassValue;
  children: ReactNode;
}) {
  return (
    <h1
      className={cn(
        "rounded-md bg-accent px-6 py-5 text-5xl text-accent-foreground dark:bg-accent-foreground dark:text-accent",
        className,
      )}
    >
      {title}
    </h1>
  );
}

export function SectionHeading({
  children: text,
  className,
}: {
  className?: ClassValue;
  children: ReactNode;
}) {
  return (
    <h3
      className={cn(
        "text-2xl font-medium leading-none tracking-tight",
        className,
      )}
    >
      {text}
    </h3>
  );
}
