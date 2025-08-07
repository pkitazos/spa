import { type ReactNode } from "react";

import { type ClassValue } from "clsx";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { buttonVariants } from "../ui/button";

export function SideButton({
  href,
  children: title,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: ClassValue;
}) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant: "outline" }),
        "w-full",
        className,
      )}
      href={href}
    >
      {title}
    </Link>
  );
}
