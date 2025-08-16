import { Plus, SquareLibraryIcon } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { api } from "@/lib/trpc/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: metadataTitle(["Admin Panel", app.institution.name, app.name]),
};

export default async function Page() {
  const superAdmins = await api.institution.superAdmins();
  const groups = await api.institution.groups();

  return (
    <PanelWrapper className="mt-5 gap-10">
      <Heading>{app.institution.name}</Heading>
      <Card className="my-10 flex flex-col gap-2 ">
        <CardHeader className="-mb-3 mt-3">
          <CardTitle>Super-Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="flex items-center gap-5">
            <TableBody className="w-full text-base">
              {superAdmins.map((admin) => (
                <TableRow className="flex w-full items-center" key={admin.id}>
                  <TableCell className="w-full font-medium">
                    {admin.name}
                  </TableCell>
                  <TableCell className="w-full text-start">
                    {admin.email}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SectionHeading icon={SquareLibraryIcon} className="mb-2">
        Manage Platform Users
      </SectionHeading>
      <Button
        className="h-20 text-base font-semibold w-1/4"
        variant="outline"
        size="lg"
        asChild
      >
        <Link
          href={`/${PAGES.superAdminPanel.href}/${PAGES.userManagement.href}`}
        >
          <span>View All Users</span>
        </Link>
      </Button>

      <Separator />

      <SectionHeading icon={SquareLibraryIcon} className="mb-2 flex">
        Manage {spacesLabels.group.full}s
      </SectionHeading>
      <div className="flex w-full flex-col gap-6">
        <Button
          size="lg"
          variant="outline"
          className="flex h-20 w-fit items-center justify-center gap-3 rounded-lg bg-accent/60 hover:bg-accent"
          asChild
        >
          <Link href={`/${PAGES.superAdminPanel.href}/${PAGES.newGroup.href}`}>
            <Plus className="h-6 w-6" />{" "}
            <span className="text-lg">Create {spacesLabels.group.short}</span>
          </Link>
        </Button>
        <div className="grid w-full grid-cols-3 gap-6">
          {groups.map(({ group, displayName }) => (
            <Button
              className="h-20 w-full text-base font-semibold col-span-1"
              variant="outline"
              size="lg"
              key={group}
              asChild
            >
              <Link href={`/${group}`}>{displayName}</Link>
            </Button>
          ))}
        </div>
      </div>
    </PanelWrapper>
  );
}
