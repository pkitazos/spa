import { getCurrentDevUser } from "@/lib/auth/actions";
import { api } from "@/lib/trpc/server";

import { UserSwitcher } from "./user-switcher";

export async function RolePicker() {
  const testUsers = await api.user.getTestUsers();
  const currentDevUser = await getCurrentDevUser();

  const currentUserId = currentDevUser?.id ?? testUsers[0]?.id;

  if (!currentUserId) return;

  return <UserSwitcher users={testUsers} currentUserId={currentUserId} />;
}
