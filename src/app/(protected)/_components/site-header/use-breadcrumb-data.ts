"use client";

import { useMemo } from "react";

import { usePathname } from "next/navigation";

import { api } from "@/lib/trpc/client";
import { unSlugify } from "@/lib/utils/general/slugify";

export function useBreadcrumbData() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((segment) => segment !== "");

  const { status, data } = api.ac.breadcrumbs.useQuery({ segments });

  const fallbackData = useMemo(
    () =>
      segments.map((segment, index) => ({
        segment: unSlugify(segment),
        access: false,
        path: `/${segments.slice(0, index + 1).join("/")}`,
      })),
    [segments],
  );

  const breadcrumbData = useMemo(() => {
    if (status === "success" && data) {
      return data.map((item, index) => ({
        ...item,
        path: `/${segments.slice(0, index + 1).join("/")}`,
      }));
    }
    return fallbackData;
  }, [status, data, fallbackData, segments]);

  return useMemo(
    () => ({
      hasItems: breadcrumbData.length > 0,
      middleItems: breadcrumbData.slice(0, -1),
      lastItem: breadcrumbData[breadcrumbData.length - 1],
    }),
    [breadcrumbData],
  );
}
