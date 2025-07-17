import { ChevronDownIcon, DatabaseIcon, ZapIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { CopyEmailsButton } from "@/components/copy-emails-button";
import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { StudentInvitesDataTable } from "./_components/student-invites-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.studentInvites.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const students = await api.institution.instance.invitedStudents({ params });

  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <SubHeading className="mb-4">{PAGES.studentInvites.title}</SubHeading>
      <section className="flex flex-col gap-5">
        <SectionHeading className="flex items-center">
          <ZapIcon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>Quick Actions</span>
        </SectionHeading>
        <Card className="w-full">
          <CardContent className="mt-6 flex items-center justify-between gap-10">
            {students.incomplete.length !== 0 ? (
              <>
                <p>
                  <span className="font-semibold">
                    {students.incomplete.length}
                  </span>{" "}
                  out of{" "}
                  <span className="font-semibold">{students.all.length}</span>{" "}
                  students have not joined the platform yet. Excludes
                  pre-allocated students by default.
                </p>
                <div className="flex w-44 items-center">
                  <CopyEmailsButton
                    data={students.incomplete}
                    className="w-36 rounded-r-none"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-8 rounded-l-none border-l-0 px-2"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-max"
                      side="bottom"
                      align="center"
                    >
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <CopyEmailsButton
                          className="flex w-full items-center gap-2 text-left"
                          label="Include Pre-allocated Students"
                          data={[
                            ...students.incomplete,
                            ...students.preAllocated,
                          ]}
                          unstyled
                        />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <p>All students have joined the platform</p>
            )}
          </CardContent>
        </Card>
      </section>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading className="flex items-center">
          <DatabaseIcon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>All data</span>
        </SectionHeading>
        <StudentInvitesDataTable data={students.all} />
      </section>
    </PanelWrapper>
  );
}
