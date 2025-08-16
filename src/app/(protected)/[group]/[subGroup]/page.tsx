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
import { type SubGroupParams } from "@/lib/validations/params";

import { AdminRemovalButton } from "./_components/admin-removal-button";
import { DeleteConfirmation } from "./_components/delete-confirmation";
import { FormButton } from "./_components/form-button";

export async function generateMetadata({ params }: { params: SubGroupParams }) {
  const allocationSubGroup = await api.institution.subGroup.exists({ params });
  if (!allocationSubGroup) notFound();

  const { displayName } = await api.institution.subGroup.get({ params });

  return { title: metadataTitle([displayName, app.name]) };
}

export default async function Page({ params }: { params: SubGroupParams }) {
  const allocationSubGroup = await api.institution.subGroup.exists({ params });
  if (!allocationSubGroup) notFound();

  const access = await api.institution.subGroup.access({ params });

  if (!access) {
    return (
      <Unauthorised message="You need to be an admin to access this page" />
    );
  }

  const { subGroupAdmins, allocationInstances, displayName } =
    await api.institution.subGroup.instanceManagement({ params });

  const { group, subGroup } = params;

  return (
    <PanelWrapper className="mt-5 gap-10">
      <Heading>{displayName}</Heading>
      <Card className="my-10 flex flex-col gap-2">
        <CardHeader className="-mb-3 mt-3">
          <CardTitle>{spacesLabels.subGroup.short} Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="flex items-center gap-5">
            <TableBody className="w-full text-base">
              {subGroupAdmins.map(({ id, name, email }, i) => (
                <TableRow className="flex w-full items-center" key={i}>
                  <TableCell className="w-1/3 font-medium">{name}</TableCell>
                  <TableCell className="w-1/3 text-start">{email}</TableCell>
                  <AdminLevelAC minimumAdminLevel={AdminLevel.GROUP}>
                    <TableCell className="flex w-1/3 justify-end">
                      <AdminRemovalButton userId={id} params={params} />
                    </TableCell>
                  </AdminLevelAC>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminLevelAC minimumAdminLevel={AdminLevel.GROUP}>
            <div className="mt-2">
              <FormButton params={params} />
            </div>
          </AdminLevelAC>
        </CardContent>
      </Card>
      <SectionHeading icon={SquareLibraryIcon}>
        Manage {spacesLabels.instance.full}s
      </SectionHeading>
      <div className="flex w-full flex-col gap-6">
        <Button
          size="lg"
          variant="outline"
          className="flex h-20 w-fit items-center justify-center gap-3 rounded-lg bg-accent/60 hover:bg-accent"
          asChild
        >
          <Link href={`/${group}/${subGroup}/create-instance`}>
            <Plus className="h-6 w-6 stroke-[3px]" />
            <p className="text-lg">Create {spacesLabels.instance.short}</p>
          </Link>
        </Button>
        <div className="grid grid-cols-3 gap-6">
          {allocationInstances.map(({ instance, displayName }, i) => (
            <Link
              className="col-span-1 flex"
              href={`/${group}/${subGroup}/${instance}`}
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
      <AdminLevelAC minimumAdminLevel={AdminLevel.GROUP}>
        <div className="mt-16">
          <DeleteConfirmation
            spaceLabel={spacesLabels.subGroup.full}
            params={params}
            name={displayName}
          />
        </div>
      </AdminLevelAC>
    </PanelWrapper>
  );
}
