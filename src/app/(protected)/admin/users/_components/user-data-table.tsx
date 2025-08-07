"use client";

import { type UserDTO } from "@/dto";

import DataTable from "@/components/ui/data-table/data-table";

import { columns } from "./user-columns";

export function UserDataTable({ users }: { users: UserDTO[] }) {
  return <DataTable columns={columns} data={users} />;
}
