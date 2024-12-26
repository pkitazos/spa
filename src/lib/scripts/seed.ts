import { PrismaClient } from "@prisma/client";

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
} from "@/db/data";

const db = new PrismaClient();

async function main() {
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
    await tx.allocationInstance.create({ data: sampleInstance(ID) });

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
