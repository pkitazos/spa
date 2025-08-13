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
  icon: Icon,
  iconClassName,
}: {
  className?: ClassValue;
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: ClassValue;
}) {
  return (
    <h3
      className={cn(
        "text-2xl font-medium leading-none tracking-tight",
        Icon && "flex items-center",
        className,
      )}
    >
      {Icon && (
        <Icon className={cn("mr-2 h-6 w-6 text-indigo-500", iconClassName)} />
      )}
      {typeof text === "string" ? <span>{text}</span> : text}
    </h3>
  );
}
