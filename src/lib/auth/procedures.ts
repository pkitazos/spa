import { type UserDTO } from "@/dto";

import { User } from "@/data-objects";

import { db } from "@/db";

/** Fetch the user record from the database
 * If none exists, one will be created
 * This function should generally be an ID
 */
export async function retrieveUser(user: UserDTO): Promise<UserDTO> {
  const userObj = new User(db, user.id);

  const dbUser = await userObj.toMaybeDTO();
  if (dbUser) return dbUser;

  try {
    const newUser = await userObj.create(user);
    return newUser;
  } catch (_err) {
    throw new Error("No valid invite found for this user");
  }
}
