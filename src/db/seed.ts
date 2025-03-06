/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from "@prisma/client";
import { student_project_allocations } from "./migrations/9_student_project_allocations";
import { algorithm_matching_results } from "./migrations/8_algorithm_matching_results";
import { users } from "./migrations/1_users";
import { spaces } from "./migrations/2_spaces";
import { admins } from "./migrations/3_admins";
import { tags_flags_algs } from "./migrations/4_tags_flags_algs";
import { student_flags } from "./migrations/5b_student_flags";
import { projects_and_pre_allocations } from "./migrations/6_projects_and_pre_allocations";
import { student_preferences } from "./migrations/7_student_preferences";
import { users_in_instance } from "./migrations/5_users_in_instance";

const db = new PrismaClient();

async function main() {
  const group = "socs";
  const subGroup = "lvl-4-and-lvl-5-honours";
  const instance = "2024-2025";

  const params = { group, subGroup, instance };

  await users(db)
    .then(() => console.log("users seeded"))
    .catch((e) => console.error("error: users", e));

  await spaces(db)
    .then(() => console.log("spaces seeded"))
    .catch((e) => console.error("error: spaces", e));

  await admins(db)
    .then(() => console.log("admins seeded"))
    .catch((e) => console.error("error: admins", e));

  await tags_flags_algs(db, params)
    .then(() => console.log("tags, flags, and algorithms seeded"))
    .catch((e) => console.error("error: tags, flags, and algorithms", e));

  await users_in_instance(db, params)
    .then(() => console.log("users in instance seeded"))
    .catch((e) => console.error("error: users in instance", e));

  await student_flags(db, params)
    .then(() => console.log("student flags seeded"))
    .catch((e) => console.error("error: student flags", e));

  await projects_and_pre_allocations(db, params)
    .then(() => console.log("projects and pre-allocations seeded"))
    .catch((e) => console.error("error: projects and pre-allocations", e));

  await student_preferences(db, params)
    .then(() => console.log("student preferences seeded"))
    .catch((e) => console.error("error: student preferences", e));

  await algorithm_matching_results(db)
    .then(() => console.log("algorithm matching results seeded"))
    .catch((e) => console.error("error: algorithm matching results", e));

  await student_project_allocations(db, params)
    .then(() => console.log("student project allocations seeded"))
    .catch((e) => console.error("error: student project allocations", e));

  console.log("\nok");
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

async function run(cb: () => Promise<void>, message: string) {
  try {
    await cb();
    console.log(message);
  } catch (e) {
    console.error(e);
  }
}
