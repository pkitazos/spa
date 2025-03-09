import { ClipboardPenIcon } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/heading";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PAGES } from "@/config/pages";
import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";
import { UnitOpenToggle } from "./_components/unit-open-toggle";
import React from "react";

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.institution.instance.getAllUnitsOfAssessment({
    params,
  });

  return (
    <section className="pt-6">
      <Table>
        <TableBody className="flex-col space-y-7">
          {data.map((x) => (
            <React.Fragment key={x.flag.id}>
              <TableRow>
                <TableCell colSpan={2}>
                  <SectionHeading className="flex items-center text-2xl no-underline">
                    <ClipboardPenIcon className="mr-2 h-6 w-6 text-indigo-500" />
                    <span>{x.flag.title}</span>
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
    </section>
  );
}
