import { Stage } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
import { z } from "zod";

import { getGMTOffset } from "@/lib/utils/date/timezone";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { instanceParamsSchema } from "@/lib/validations/params";
import { supervisorInstanceCapacitiesSchema } from "@/lib/validations/supervisor-project-submission-details";

import {
  createTRPCRouter,
  instanceAdminProcedure,
  instanceProcedure,
  roleAwareProcedure,
} from "@/server/trpc";
import { computeProjectSubmissionTarget } from "@/server/utils/instance/submission-target";

import { formatSupervisorRowProjects } from "./_utils/supervisor-row-projects";

export const supervisorRouter = createTRPCRouter({
  exists: instanceProcedure
    .input(z.object({ params: instanceParamsSchema, supervisorId: z.string() }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorId,
        },
      }) => {
        const exists = await ctx.db.supervisorInstanceDetails.findFirst({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            userId: supervisorId,
          },
        });
        return !!exists;
      },
    ),

  allocationAccess: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx }) => ctx.instance.supervisorAllocationAccess),

  setAllocationAccess: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        access: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input: { params, access } }) => {
      await ctx.db.allocationInstance.update({
        where: {
          instanceId: {
            allocationGroupId: params.group,
            allocationSubGroupId: params.subGroup,
            id: params.instance,
          },
        },
        data: { supervisorAllocationAccess: access },
      });

      return access;
    }),

  instancePage: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const { displayName, projectSubmissionDeadline } =
          await ctx.db.allocationInstance.findFirstOrThrow({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              id: instance,
            },
            select: {
              displayName: true,
              projectSubmissionDeadline: true,
            },
          });

        return {
          displayName,
          projectSubmissionDeadline: toZonedTime(
            projectSubmissionDeadline,
            "Europe/London",
          ),
          deadlineTimeZoneOffset: getGMTOffset(projectSubmissionDeadline),
        };
      },
    ),

  instanceData: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        supervisorId: z.string(),
      }),
    )
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorId,
        },
      }) => {
        const supervisorData =
          await ctx.db.supervisorInstanceDetails.findFirstOrThrow({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: supervisorId,
            },
            select: {
              projectAllocationTarget: true,
              projectAllocationUpperBound: true,
              userInInstance: {
                select: {
                  user: { select: { id: true, name: true, email: true } },
                  supervisorProjects: {
                    select: {
                      id: true,
                      title: true,
                      supervisorId: true,
                      preAllocatedStudentId: true,
                      tagOnProject: { select: { tag: true } },
                      flagOnProjects: { select: { flag: true } },
                      allocations: {
                        select: { student: { select: { user: true } } },
                      },
                    },
                  },
                },
              },
            },
          });

        const supervisor = {
          id: supervisorData.userInInstance.user.id,
          name: supervisorData.userInInstance.user.name,
          email: supervisorData.userInInstance.user.email,
          projectTarget: supervisorData.projectAllocationTarget,
          projectUpperQuota: supervisorData.projectAllocationUpperBound,
        };

        const projects = supervisorData.userInInstance.supervisorProjects.map(
          (p) => ({
            id: p.id,
            title: p.title,
            supervisorId: p.supervisorId,
            preAllocatedStudentId: p.preAllocatedStudentId ?? undefined,
            tags: p.tagOnProject.map((t) => t.tag),
            flags: p.flagOnProjects.map((f) => f.flag),
            allocatedStudents: p.allocations.map((a) => a.student.user),
          }),
        );

        return { supervisor, projects };
      },
    ),

  projects: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const userId = ctx.session.user.id;
        const parentInstanceId = ctx.instance.parentInstanceId;

        const allProjects = await ctx.db.project.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            supervisorId: userId,
          },
          select: {
            id: true,
            title: true,
            description: true,
            capacityLowerBound: true,
            capacityUpperBound: true,
            preAllocatedStudentId: true,
            allocations: {
              select: {
                student: {
                  select: { user: { select: { id: true, name: true } } },
                },
              },
            },
          },
        });

        let totalAllocatedCount = 0;
        if (parentInstanceId) {
          const forkedPreAllocatedCount = allProjects.reduce(
            (acc, val) => (val.preAllocatedStudentId ? acc + 1 : acc),
            0,
          );

          const parentAllocatedCount = await ctx.db.projectAllocation.count({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: parentInstanceId,
              project: { supervisorId: userId },
            },
          });

          totalAllocatedCount += forkedPreAllocatedCount + parentAllocatedCount;
        } else {
          const allocatedCount = await ctx.db.projectAllocation.count({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              project: { supervisorId: userId },
            },
          });

          totalAllocatedCount += allocatedCount;
        }

        const { projectAllocationTarget } =
          await ctx.db.supervisorInstanceDetails.findFirstOrThrow({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId,
            },
            select: { projectAllocationTarget: true },
          });

        return {
          currentSubmissionCount: allProjects.length,
          submissionTarget: computeProjectSubmissionTarget(
            projectAllocationTarget,
            totalAllocatedCount,
          ),
          rowProjects: formatSupervisorRowProjects(allProjects),
        };
      },
    ),

    readings: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const userId = ctx.session.user.id;

        const allReadings = await ctx.db.projectAllocationReader.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            readerId: userId,
          }
        });

        const projectIds = [];

        for (var read of allReadings) {
          projectIds.push(read.projectId);
        }

        const projects = await ctx.db.project.findMany({
          where: {
            id: { in: projectIds}
          }
        });

        for (let i = 0; i < projects.length; i++) {
          if (projects[i].description.length >= 200) {
            projects[i].description = projects[i].description.slice(0,100)+"...";
          }
        }

        return {
          projects
        };
      },
    ),

  updateInstanceCapacities: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        supervisorId: z.string(),
        capacities: supervisorInstanceCapacitiesSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorId,
          capacities: { projectTarget, projectUpperQuota },
        },
      }) => {
        await ctx.db.supervisorInstanceDetails.update({
          where: {
            detailsId: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: supervisorId,
            },
          },
          data: {
            projectAllocationTarget: projectTarget,
            projectAllocationUpperBound: projectUpperQuota,
          },
        });

        return { projectTarget, projectUpperQuota };
      },
    ),

  delete: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, supervisorId: z.string() }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorId,
        },
      }) => {
        if (stageGte(ctx.instance.stage, Stage.PROJECT_ALLOCATION)) return;

        await ctx.db.userInInstance.delete({
          where: {
            instanceMembership: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: supervisorId,
            },
          },
        });
      },
    ),

  deleteSelected: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        supervisorIds: z.array(z.string()),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorIds,
        },
      }) => {
        if (stageGte(ctx.instance.stage, Stage.PROJECT_ALLOCATION)) return;

        await ctx.db.userInInstance.deleteMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            userId: { in: supervisorIds },
          },
        });
      },
    ),

  allocations: roleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const user = ctx.session.user;
        const data = await ctx.db.projectAllocation.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            project: { supervisorId: user.id },
          },
          select: {
            studentRanking: true,
            project: { select: { id: true, title: true } },
            student: {
              select: {
                studentDetails: true,
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        });
        return data.map(({ project, student, studentRanking: rank }) => ({
          project,
          student: {
            ...student.user,
            rank,
            level: student.studentDetails[0].studentLevel,
          },
        }));
      },
    ),
});
