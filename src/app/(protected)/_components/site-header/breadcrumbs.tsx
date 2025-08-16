"use client";

import { Fragment } from "react";

import { MoreHorizontalIcon as MoreIcon } from "lucide-react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useBreadcrumbData } from "./use-breadcrumb-data";

export function Breadcrumbs() {
  const { hasItems, middleItems, lastItem } = useBreadcrumbData();

  if (!hasItems) return <Fragment />;

  return (
    <div className="@container w-full">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/"
                className="text-primary px-3 py-1 rounded-md hover:text-secondary hover:bg-muted"
              >
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {hasItems && (
            <>
              <BreadcrumbSeparator className="block @md:hidden" />
              <BreadcrumbItem className="@md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted">
                    <MoreIcon className="h-4 w-4" />
                    <span className="sr-only">Show hidden breadcrumbs</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {middleItems.map(({ segment, access, path }) => (
                      <DropdownMenuItem key={path} asChild>
                        {access ? (
                          <Link
                            href={path}
                            className="text-primary px-3 py-1 rounded-md hover:text-secondary hover:bg-muted"
                          >
                            {segment}
                          </Link>
                        ) : (
                          <span className="text-primary px-3 py-1">
                            {segment}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>

              {middleItems.map(({ path, segment }) => (
                <Fragment key={path}>
                  <BreadcrumbSeparator className="hidden @md:block" />
                  <BreadcrumbItem className="hidden @md:block">
                    <BreadcrumbLink asChild>
                      <Link
                        href={path}
                        className="text-primary px-3 py-1 rounded-md hover:text-secondary hover:bg-muted"
                      >
                        {segment}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </Fragment>
              ))}

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">
                  {lastItem.segment}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
