import { TRPCClientError } from "@trpc/client";

import { TX } from "@/db/types";

export async function validateEmailGUIDMatch(
  tx: TX,
  institutionId: string,
  email: string,
  name: string,
) {
  // Find user with this email address
  let user = await tx.user.findFirst({
    where: { id: institutionId, email },
  });

  if (user) {
    return user;
  }
  // TODO: check if this is correct
  // TODO: correct any users who have a blank email
  // See if this user exists with no/empty email address
  user = await tx.user.findFirst({
    where: { id: institutionId, email },
  });
  if (user) {
    // We found the user with a blank email, but the function
    // parameter email isn't empty (else the earlier return would
    // fire) so update the email address
    user = await tx.user.update({
      where: { id: institutionId },
      data: { email: email },
    });
    return user;
  }
  // Could not find the user, so create them
  try {
    user = await tx.user.create({
      data: {
        id: institutionId,
        name,
        email,
      },
    });
  } catch (e) {
    // this email is already taken
    throw new TRPCClientError("GUID and email do not match");
  }

  return user;
}
