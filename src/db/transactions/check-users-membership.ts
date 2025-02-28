import { Err, OK, Result } from "@/lib/utils/general/result";

import { TX } from "../types";

export function checkMembership<T>(
  newUsers: T[],
  existingKeys: Set<string>,
  getKey: (u: T) => string,
  error: string,
): Result<T, [T, string]>[] {
  return newUsers.map((u) =>
    existingKeys.has(getKey(u)) ? Err([u, error]) : OK(u),
  );
}

export async function checkUsersMembership<
  T extends { institutionId: string; email: string; fullName: string },
>(tx: TX, newUsers: T[], existingUserRoleIds: string[]) {
  const userData = await tx.user.findMany({
    select: { id: true, email: true },
  });

  const dbUserKeys = userData.map((u) => `${u.id}-${u.email!}`);
  const dbUserEmails = userData.map((u) => u.email!);

  const results_batch_1 = checkMembership(
    newUsers,
    new Set(existingUserRoleIds),
    (u) => u.institutionId,
    "Some users already exist in the instance",
  );

  // already users in the instance as the same role
  const fails_batch_A = results_batch_1
    .map((res) => (!res.success ? res.msg : null))
    .filter((x) => !!x);

  // do not exist in the instance already
  // want to check if there already exists an associated user account for them
  const success_batch_1 = results_batch_1
    .map((res) => (res.success ? res.data : null))
    .filter((x) => !!x);

  const results_batch_2 = checkMembership(
    success_batch_1,
    new Set(dbUserKeys),
    (u) => `${u.institutionId}-${u.email}`,
    "User with this exact email and ID exists",
  );

  // looks like there are in fact user accounts associated with these Ids and Emails
  // these are safe to be added to the instance (no new user account is necessary)
  // can throw error out
  const validNewUsersInInstance = results_batch_2
    .map((res) => (!res.success ? res.msg[0] : null))
    .filter((x) => !!x);

  // does not seem to be the case that a user with these exact credentials exists
  // not necessarily a bad thing (could be a new user or it could be that this email is taken)
  // but we need to check that their emails don't exist either
  const new_users_batch_1 = results_batch_2
    .map((res) => (res.success ? res.data : null))
    .filter((x) => !!x);

  const results_batch_3 = checkMembership(
    new_users_batch_1,
    new Set(dbUserEmails),
    (u) => u.email,
    "Some GUIDs and emails do not seem to match", // this email is taken by another user
  );

  // GUID and email don't match
  const fails_batch_B = results_batch_3
    .map((res) => (!res.success ? res.msg : null))
    .filter((x) => !!x);

  const validNewUsers = results_batch_3
    .map((res) => (res.success ? res.data : null))
    .filter((x) => !!x);

  await tx.user.createMany({
    data: validNewUsers.map((u) => ({
      id: u.institutionId,
      name: u.fullName,
      email: u.email,
    })),
    skipDuplicates: true, // possibly unnecessary
  });

  return {
    validatedNewUsers: [...validNewUsers, ...validNewUsersInInstance],
    errors: [...fails_batch_A, ...fails_batch_B],
  };
}
