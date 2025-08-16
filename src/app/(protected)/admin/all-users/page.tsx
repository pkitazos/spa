import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";

import { UserDataTable } from "./_components/user-data-table";

export const dynamic = "force-dynamic";

export default async function UserPage() {
  const allUsers = await api.institution.getAllUsers();

  return (
    <PanelWrapper className="mt-5">
      <Heading>User Management</Heading>
      <UserDataTable users={allUsers} />
    </PanelWrapper>
  );
}
