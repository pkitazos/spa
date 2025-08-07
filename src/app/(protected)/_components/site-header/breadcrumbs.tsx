"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { api } from "@/lib/trpc/client";
import { unSlugify } from "@/lib/utils/general/slugify";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((segment) => segment !== "");

  const { status, data } = api.ac.breadcrumbs.useQuery({ segments });

  if (segments.length === 0) return <></>;

  if (status !== "success") {
    return (
      <Breadcrumb className="w-full flex-nowrap">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/"
                prefetch={false}
                className="hover:text-secondary hover:underline"
              >
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment) => (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">
                  {unSlugify(segment)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb className="w-full flex-nowrap">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href="/"
              prefetch={false}
              className="hover:text-secondary hover:underline"
            >
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {data.map(({ segment, access }, index) => (
          <React.Fragment key={segment}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index < segments.length - 1 && access ? (
                <BreadcrumbLink asChild>
                  <Link
                    href={`/${segments.slice(0, index + 1).join("/")}`}
                    className="hover:text-secondary hover:underline"
                    prefetch={false}
                  >
                    {segment}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-muted-foreground">
                  {segment}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
