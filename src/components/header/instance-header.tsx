"use client";

import { useParams } from "next/navigation";

import { api } from "@/lib/trpc/client";
import { type InstanceParams } from "@/lib/validations/params";

import { InstanceLink } from "./instance-link";

export function InstanceHeader() {
  const params = useParams<Partial<InstanceParams>>();
  const { data } = api.institution.instance.getHeaderTabs.useQuery({ params });

  if (!data) return;

  return (
    <div className="mx-auto flex items-center justify-center gap-6">
      {data.headerTabs.map(({ href, title }, i) => (
        <InstanceLink key={i} href={`${data.instancePath}/${href}`}>
          {title}
        </InstanceLink>
      ))}
    </div>
  );
}
