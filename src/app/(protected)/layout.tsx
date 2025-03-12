import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await auth();
  // add whitelist of users
  if (!user) redirect("/");

  return <>{children}</>;
}
