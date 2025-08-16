import { type ReactNode } from "react";

import Link from "next/link";

import { type PageName } from "@/config/pages";

import { mkHref, type LinkArgs } from ".";

export function AppLink<T extends PageName>({
  page,
  linkArgs,
  disabled = false,
  children,
}: {
  page: T;
  linkArgs: LinkArgs<T>;
  disabled?: boolean;
  children?: ReactNode;
}) {
  if (disabled) return <div>{children}</div>;
  return <Link href={mkHref(page, linkArgs)}>{children}</Link>;
}
