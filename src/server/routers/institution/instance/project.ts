import { z } from "zod";

import { findByUserId } from "@/lib/utils/general/find-by-user-id";
import { instanceParamsSchema } from "@/lib/validations/params";
import { SupervisorProjectSubmissionDetails } from "@/lib/validations/supervisor-project-submission-details";

import {
  createTRPCRouter,
  instanceAdminProcedure,
  instanceMiddleware,
} from "@/server/trpc";
import { computeProjectSubmissionTarget } from "@/server/utils/instance/submission-target";

import { computeSubmissionDetails } from "@/db/transactions/submission-details";

export const projectRouter = createTRPCRouter({
  submissionInfo: instanceAdminProcedure
    .use(instanceMiddleware)
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const parentInstanceId = ctx.instance.parentInstanceId;

        const submissionDetails: SupervisorProjectSubmissionDetails[] = [];

        if (parentInstanceId) {
          const parentInstanceSubmissionDetails =
            await computeSubmissionDetails(ctx.db, {
              group,
              subGroup,
              instance: parentInstanceId,
            });

          const forkedInstanceSubmissionDetails =
            await computeSubmissionDetails(ctx.db, {
              group,
              subGroup,
              instance,
            });

          forkedInstanceSubmissionDetails.forEach(
            ({ projectAllocationTarget, userId, ...forked }) => {
              let parentAllocationCount = 0;
              try {
                parentAllocationCount = findByUserId(
                  parentInstanceSubmissionDetails,
                  userId,
                ).allocatedCount;
              } catch (e) {
                // this means the supervisor is new
                // so they don't have an equivalent in the parent instance
                parentAllocationCount = 0;
              }

              const newAllocatedCount =
                forked.allocatedCount + parentAllocationCount;

              const newSubmissionTarget = computeProjectSubmissionTarget(
                projectAllocationTarget,
                newAllocatedCount,
              );

              submissionDetails.push({
                userId,
                name: forked.name,
                email: forked.email,
                projectAllocationTarget,
                allocatedCount: newAllocatedCount,
                submittedProjectsCount: forked.submittedProjectsCount,
                submissionTarget: newSubmissionTarget,
              });
            },
          );
        } else {
          const currentInstanceSubmissionDetails =
            await computeSubmissionDetails(ctx.db, {
              group,
              subGroup,
              instance,
            });

          submissionDetails.push(...currentInstanceSubmissionDetails);
        }

        return submissionDetails.map((c) => ({
          ...c,
          targetMet: c.submittedProjectsCount >= c.submissionTarget,
        }));
      },
    ),
});
