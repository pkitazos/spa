import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import { PrismaClient } from "@prisma/client";

async function missingReader(
  params: InstanceParams,
  testParams: InstanceParams,
  db: PrismaClient,
) {
  const user = await db.user.findUnique({ where: { id: "ag433g" } });

  if (!user) {
    const aliUser = await db.user.create({
      data: {
        id: "ag433g",
        name: "Ali Gooya",
        email: "ali.gooya@glasgow.ac.uk",
      },
    });
    console.log("Created user %s", aliUser.name);
  } else {
    console.log("%s already exists", user.name);
  }

  const inst = await db.userInInstance.findFirst({
    where: { userId: "ag433g" },
  });

  if (!inst) {
    const aliInst = await db.userInInstance.create({
      data: { ...expand(params), userId: "ag433g" },
    });

    console.log(
      "Created userInInstance %s in instance %s",
      aliInst.userId,
      params.instance,
    );

    const aliTestInst = await db.userInInstance.create({
      data: { ...expand(testParams), userId: "ag433g" },
    });

    console.log(
      "Created userInInstance %s in instance %s",
      aliInst.userId,
      testParams.instance,
    );
  }

  const aliSupCheck = await db.supervisorDetails.findFirst({
    where: { userId: "ag433g" },
  });

  if (aliSupCheck) {
    console.log("Supervisor %s already exists", aliSupCheck.userId);
    return;
  } else {
    const aliSuper = await db.supervisorDetails.create({
      data: {
        ...expand(params),
        projectAllocationLowerBound: 0,
        projectAllocationTarget: 0,
        projectAllocationUpperBound: 1,
        userId: "ag433g",
      },
    });

    console.log(
      "Created supervisor %s in instance %s",
      aliSuper.userId,
      aliSuper.allocationInstanceId,
    );
  }

  const aliTestSupCheck = await db.supervisorDetails.findFirst({
    where: { userId: "ag433g" },
  });

  if (aliTestSupCheck) {
    console.log("Supervisor %s already exists", aliTestSupCheck.userId);
    return;
  } else {
    const aliTestSuper = await db.supervisorDetails.create({
      data: {
        ...expand(testParams),
        projectAllocationLowerBound: 0,
        projectAllocationTarget: 0,
        projectAllocationUpperBound: 1,
        userId: "ag433g",
      },
    });

    console.log(
      "Created supervisor %s in instance %s",
      aliTestSuper.userId,
      aliTestSuper.allocationInstanceId,
    );
  }

  const aliReaderCheck = await db.readerDetails.findFirst({
    where: { userId: "ag433g" },
  });

  if (aliReaderCheck) {
    console.log("Reader %s already exists", aliReaderCheck.userId);
    return;
  } else {
    const aliReader = await db.readerDetails.create({
      data: {
        ...expand(params),
        projectAllocationLowerBound: 0,
        projectAllocationTarget: 0,
        projectAllocationUpperBound: 1,
        userId: "ag433g",
      },
    });

    console.log(
      "Created reader %s in instance %s",
      aliReader.userId,
      aliReader.allocationInstanceId,
    );
  }

  const aliTestReaderCheck = await db.readerDetails.findFirst({
    where: { userId: "ag433g" },
  });

  if (aliTestReaderCheck) {
    console.log("Reader %s already exists", aliTestReaderCheck.userId);
    return;
  } else {
    const aliTestReader = await db.readerDetails.create({
      data: {
        ...expand(testParams),
        projectAllocationLowerBound: 0,
        projectAllocationTarget: 0,
        projectAllocationUpperBound: 1,
        userId: "ag433g",
      },
    });

    console.log(
      "Created reader %s in instance %s",
      aliTestReader.userId,
      aliTestReader.allocationInstanceId,
    );
  }

  const allocations = [
    {
      projectId: "c0f990fb-4ea5-4aeb-ac41-78fea940ceb4",
      testProjectId: "22e2cc26-5374-40f8-a10d-2b71dc99fd2f",
      studentId: "2663826O",
    },
    {
      projectId: "53b78411-a500-4858-931c-ac5bae02d5b1",
      testProjectId: "99f4769f-8a8c-403c-be2d-21a233fb0a73",
      studentId: "2655106L",
    },
    {
      projectId: "bb366772-f35f-49be-a63d-8168f4963384",
      testProjectId: "c6620b0c-23b1-47cd-8412-f18d7bcaed96",
      studentId: "2653288I",
    },
    {
      projectId: "a307cb1e-18cd-4f6b-8a2a-c7980d5a6bb8",
      testProjectId: "c18c3640-d921-41e2-a53d-b7acd74e809e",
      studentId: "2655731M",
    },
    {
      projectId: "4fd64bf4-3b2b-483a-ac66-ae22a08c729c",
      testProjectId: "ab568a9a-e38e-460d-9b14-514555552052",
      studentId: "2645294S",
    },
    {
      projectId: "e9fb8514-3957-45b9-8ade-514d80ac8739",
      testProjectId: "3747cde9-2efd-4be5-989b-68dfe6782d99",
      studentId: "2666539A",
    },
    {
      projectId: "55fa740f-2d69-4691-88e4-96525d7f260c",
      testProjectId: "ce5eab57-b785-4e92-a45f-175755b90a9e",
      studentId: "2645295B",
    },
  ];

  for (var alloc of allocations) {
    await db.readerProjectAllocation.create({
      data: {
        ...expand(params),
        readerId: "ag433g",
        projectId: alloc.projectId,
        studentId: alloc.studentId,
      },
    });
    console.log(
      "Created reader project allocation %s in instance %s",
      alloc.projectId,
      params.instance,
    );

    await db.readerProjectAllocation.create({
      data: {
        ...expand(testParams),
        readerId: "ag433g",
        projectId: alloc.testProjectId,
        studentId: alloc.studentId,
      },
    });
    console.log(
      "Created reader project allocation %s in instance %s",
      alloc.testProjectId,
      testParams.instance,
    );
  }
}
