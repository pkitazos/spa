import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";

import {
  algorithms,
  allUsers,
  allUsersInInstance,
  capacities,
  flags,
  flagsOnProjects,
  invites,
  preferences,
  projects,
  sampleGroup,
  sampleInstance,
  sampleSubGroup,
  savedPreferences,
  studentDetails,
  superAdmin_levels,
  superAdmin_users,
  tags,
  tagsOnProjects,
} from "@/lib/db/data";

const db = new PrismaClient();

async function clearDatabase() {
  await db.$transaction([
    db.user.deleteMany(),
    db.adminInSpace.deleteMany(),
    db.invitation.deleteMany(),
    db.allocationGroup.deleteMany(),
    db.allocationSubGroup.deleteMany(),
    db.allocationInstance.deleteMany(),
    db.project.deleteMany(),
    db.preference.deleteMany(),
    db.flag.deleteMany(),
    db.tag.deleteMany(),
    // Add other tables as needed
  ]);
}

async function main() {
  await clearDatabase(); // Clear the database first

  await db.$transaction(async (tx) => {
    await tx.user.createMany({ data: superAdmin_users });
    await tx.adminInSpace.createMany({ data: superAdmin_levels });
    // create and invite users
    const ID = "000";
    await tx.user.createMany({ data: allUsers(ID) });
    await tx.invitation.createMany({ data: invites(ID) });

    // create spaces
    await tx.allocationGroup.create({ data: sampleGroup(ID) });
    await tx.allocationSubGroup.create({ data: sampleSubGroup(ID) });
    await tx.allocationInstance.create({
      data: {
        ...sampleInstance(ID),
        interimMarkingDeadline: addDays(new Date(), 14),
        markingSubmissionDeadline: addDays(new Date(), 30),
      },
    });

    // add users to spaces
    await tx.userInInstance.createMany({ data: allUsersInInstance(ID) });

    // add algorithms, flags, and tags to instance
    await tx.algorithm.createMany({ data: algorithms(ID) });
    await tx.tag.createMany({ data: tags(ID) });
    await tx.flag.createMany({ data: flags(ID) });

    // add student details
    await tx.studentDetails.createMany({ data: studentDetails(ID) });

    // add supervisor capacity details
    await tx.supervisorInstanceDetails.createMany({ data: capacities(ID) });

    // create projects and preferences
    await tx.project.createMany({ data: projects(ID) });
    await tx.tagOnProject.createMany({ data: tagsOnProjects(ID) });
    await tx.flagOnProject.createMany({ data: flagsOnProjects(ID) });
    await tx.preference.createMany({ data: preferences(ID) });
    await tx.savedPreference.createMany({ data: savedPreferences(ID) });
  });

  console.log("SEEDING COMPLETE");
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
