import { Plus, SquareLibraryIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { app, metadataTitle } from "@/config/meta";
import { spacesLabels } from "@/config/spaces";

import { AdminLevel } from "@/db/types";

import { AdminLevelAC } from "@/components/access-control/admin-level-ac";
import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { type GroupParams } from "@/lib/validations/params";

import { AdminRemovalButton } from "./_components/admin-removal-button";
import { DeleteConfirmation } from "./_components/delete-confirmation";
import { FormButton } from "./_components/form-button";

export async function generateMetadata({ params }: { params: GroupParams }) {
  const allocationGroup = await api.institution.group.exists({ params });
  if (!allocationGroup) notFound();

  const { displayName } = await api.institution.group.get({ params });

  return { title: metadataTitle([displayName, app.name]) };
}

export default async function Page({ params }: { params: GroupParams }) {
  const allocationGroup = await api.institution.group.exists({ params });
  if (!allocationGroup) notFound();

  const access = await api.institution.group.access({ params });

  if (!access) {
    return (
      <Unauthorised message="You need to be a super-admin or group admin to access this page" />
    );
  }

  const { displayName } = await api.institution.group.get({ params });
  const groupAdmins = await api.institution.group.groupAdmins({ params });
  const subGroups = await api.institution.group.subGroups({ params });

  return (
    <PanelWrapper className="mt-5 gap-10">
      <Heading>{displayName}</Heading>
      <Card className="my-10 flex flex-col gap-2">
        <CardHeader className="-mb-3 mt-3">
          <CardTitle>{spacesLabels.group.short} Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="flex items-center gap-5">
            <TableBody className="w-full text-base">
              {groupAdmins.map(({ id, name, email }, i) => (
                <TableRow className="flex w-full items-center" key={i}>
                  <TableCell className="w-1/3 font-medium">{name}</TableCell>
                  <TableCell className="w-1/3 text-start">{email}</TableCell>
                  <AdminLevelAC minimumAdminLevel={AdminLevel.SUPER}>
                    <TableCell className="flex w-1/3 justify-end">
                      <AdminRemovalButton userId={id} params={params} />
                    </TableCell>
                  </AdminLevelAC>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminLevelAC minimumAdminLevel={AdminLevel.SUPER}>
            <div className="mt-2">
              <FormButton params={params} />
            </div>
          </AdminLevelAC>
        </CardContent>
      </Card>
      <SectionHeading icon={SquareLibraryIcon}>
        Manage {spacesLabels.subGroup.full}s
      </SectionHeading>
      <div className="flex w-full flex-col gap-6">
        <Link href={`/${params.group}/create-sub-group`} className="w-fit">
          <Button
            size="lg"
            variant="outline"
            className="flex h-20 w-full items-center justify-center gap-3 rounded-lg bg-accent/60 hover:bg-accent"
          >
            <Plus className="h-6 w-6 stroke-[3px]" />
            <p className="text-lg">Create {spacesLabels.subGroup.short}</p>
          </Button>
        </Link>
        <div className="grid grid-cols-3 gap-6">
          {subGroups.map(({ subGroup, displayName }, i) => (
            <Link
              className="col-span-1"
              href={`/${params.group}/${subGroup}`}
              key={i}
            >
              <Button
                className="h-20 w-full text-base font-semibold"
                variant="outline"
                size="lg"
              >
                {displayName}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      <AdminLevelAC minimumAdminLevel={AdminLevel.SUPER}>
        <div className="mt-16">
          <DeleteConfirmation
            spaceLabel={spacesLabels.group.full}
            params={params}
            name={displayName}
          />
        </div>
      </AdminLevelAC>
    </PanelWrapper>
  );
}
