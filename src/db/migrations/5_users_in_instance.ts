import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import studentDetails from "./data/StudentDetails.json";
import supervisorDetails from "./data/SupervisorInstanceDetails.json";
import userInInstances from "./data/UserInInstance.json";

export async function users_in_instance(
  db: PrismaClient,
  params: InstanceParams,
) {
  const userInInstanceData = userInInstances
    .filter(
      (x) =>
        x.allocation_group_id === params.group &&
        x.allocation_sub_group_id === params.subGroup &&
        x.allocation_instance_id === params.instance,
    )
    .map((x) => ({ userId: x.user_id, joined: x.joined, ...expand(params) }));

  const studentData = studentDetails
    .filter(
      (x) =>
        x.allocation_group_id === params.group &&
        x.allocation_sub_group_id === params.subGroup &&
        x.allocation_instance_id === params.instance,
    )
    .map((x) => ({
      userId: x.user_id,
      studentLevel: x.student_level,
      latestSubmissionDateTime: x.latest_submission_date_time
        ? new Date(x.latest_submission_date_time)
        : null,
      ...expand(params),
    }));

  const supervisorData = supervisorDetails
    .filter(
      (x) =>
        x.allocation_group_id === params.group &&
        x.allocation_sub_group_id === params.subGroup &&
        x.allocation_instance_id === params.instance,
    )
    .map((x) => ({
      userId: x.user_id,
      projectAllocationLowerBound: x.project_allocation_lower_bound,
      projectAllocationTarget: x.project_allocation_target,
      projectAllocationUpperBound: x.project_allocation_upper_bound,
      ...expand(params),
    }));

  await db.$transaction([
    db.userInInstance.createMany({
      data: userInInstanceData,
      skipDuplicates: true,
    }),

    db.studentDetails.createMany({ data: studentData, skipDuplicates: true }),

    db.supervisorDetails.createMany({
      data: supervisorData,
      skipDuplicates: true,
    }),
    // Add student flags here
  ]);
}
