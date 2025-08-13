import React from "react";

import { ClipboardPenIcon } from "lucide-react";
import Link from "next/link";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { UnitOpenToggle } from "./_components/unit-open-toggle";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.unitsOfAssessment.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.institution.instance.getAllUnitsOfAssessment({
    params,
  });

  return (
    <PanelWrapper className="gap-10">
      <Heading>{PAGES.unitsOfAssessment.title}</Heading>
      <Table>
        <TableBody className="flex-col space-y-7">
          {data.map((x) => (
            <React.Fragment key={x.flag.id}>
              <TableRow>
                <TableCell colSpan={2}>
                  <SectionHeading
                    icon={ClipboardPenIcon}
                    className="flex items-center text-2xl no-underline"
                  >
                    {x.flag.displayName}
                  </SectionHeading>
                </TableCell>
              </TableRow>
              {x.units.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link
                      href={`./${PAGES.unitsOfAssessment.href}/${u.id}`}
                      className={buttonVariants({ variant: "link" })}
                    >
                      {u.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <UnitOpenToggle unitOfAssessmentId={u.id} open={u.isOpen} />
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </PanelWrapper>
  );
}
