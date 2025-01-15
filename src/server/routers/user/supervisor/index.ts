import { Stage } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
import { z } from "zod";

import { getGMTOffset } from "@/lib/utils/date/timezone";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { instanceParamsSchema } from "@/lib/validations/params";
import { supervisorInstanceCapacitiesSchema } from "@/lib/validations/supervisor-project-submission-details";

import { procedure } from "@/server/middleware";
import { createTRPCRouter, instanceAdminProcedure } from "@/server/trpc";
import { computeProjectSubmissionTarget } from "@/server/utils/instance/submission-target";

import { formatSupervisorRowProjects } from "./_utils/supervisor-row-projects";

import {
  project__AllocatedStudents_Flags_Tags_Schema,
  project__Capacities_Schema,
  supervisionAllocationDtoSchema,
  supervisorDtoSchema,
} from "@/dto/supervisor_router";

export const supervisorRouter = createTRPCRouter({
  /**
   * @version DAL
   */
  exists: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema, supervisorId: z.string() }))
    .output(z.boolean())
    .query(async ({ ctx: { dal }, input: { supervisorId, params } }) =>
      dal.supervisor.exists(supervisorId, params),
    ),

  /**
   * @version DAL
   */
  allocationAccess: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.boolean())
    .query(async ({ ctx: { instance } }) =>
      instance.getSupervisorProjectAllocationAccess(),
    ),

  // !this does not allow any admin level, it only allows subgroupAdmin?
  // perhaps this is where instanceAdmin would come in handy?
  /**
   * @version DAL
   */
  setAllocationAccess: procedure.instance.subgroupAdmin
    .input(z.object({ params: instanceParamsSchema, access: z.boolean() }))
    .output(z.boolean())
    .mutation(async ({ ctx: { dal }, input: { params, access } }) =>
      dal.instance.setSupervisorProjectAllocationAccess(access, params),
    ),

  // this one should be pretty straightforward, however I'm not sure how to handle the transformation of the data
  // or whether this could be wrapped up in some sort of DTO
  instancePage: procedure.instance.supervisor
    .input(z.object({ params: instanceParamsSchema }))
    .output(
      z.object({
        displayName: z.string(),
        projectSubmissionDeadline: z.date(),
        deadlineTimeZoneOffset: z.string(),
      }),
    )
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
    .output(
      z.object({
        supervisor: supervisorDtoSchema,
        projects: z.array(project__AllocatedStudents_Flags_Tags_Schema),
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
        const supervisorData = await ctx.db.supervisorDetails.findFirstOrThrow({
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
              },
            },
            projects: {
              select: {
                supervisorId: true,
                studentAllocations: {
                  select: {
                    student: {
                      select: { userInInstance: { select: { user: true } } },
                    },
                  },
                },
                details: {
                  select: {
                    id: true,
                    title: true,
                    preAllocatedStudentId: true,
                    tagsOnProject: { select: { tag: true } },
                    flagsOnProject: { select: { flag: true } },
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

        const projects = supervisorData.projects.map((p) => ({
          id: p.details.id,
          title: p.details.title,
          supervisorId: p.supervisorId,
          preAllocatedStudentId: p.details.preAllocatedStudentId ?? undefined,
          tags: p.details.tagsOnProject.map((t) => t.tag),
          flags: p.details.flagsOnProject.map((f) => f.flag),
          allocatedStudents: p.studentAllocations.map(
            (a) => a.student.userInInstance.user,
          ),
        }));

        return { supervisor, projects };
      },
    ),

  /**
   * @version DAL
   */
  // ? not sure about the output schema definition here
  projects: procedure.instance.supervisor
    .input(z.object({ params: instanceParamsSchema }))
    .output(
      z.object({
        currentSubmissionCount: z.number(),
        submissionTarget: z.number(),
        rowProjects: z.array(
          project__Capacities_Schema.extend({
            allocatedStudentId: z.string().optional(),
            allocatedStudentName: z.string().optional(),
          }),
        ),
      }),
    )
    .query(async ({ ctx: { dal, instance, user }, input: { params } }) => {
      const parentInstanceId = await instance.getParentInstanceId();

      const allProjects = await dal.supervisor.getAllProjects(user.id, params);

      let totalAllocatedCount = 0;
      if (parentInstanceId) {
        const forkedPreAllocatedCount = allProjects.reduce(
          (acc, val) => (val.preAllocatedStudentId ? acc + 1 : acc),
          0,
        );

        const parentAllocatedCount = await dal.supervisor
          .getSupervisionAllocations(user.id, {
            ...params,
            instance: parentInstanceId,
          })
          .then((allocations) => allocations.length);

        totalAllocatedCount += forkedPreAllocatedCount + parentAllocatedCount;
      } else {
        const allocatedCount = await dal.supervisor
          .getSupervisionAllocations(user.id, params)
          .then((allocations) => allocations.length);

        totalAllocatedCount += allocatedCount;
      }

      const { projectTarget: projectAllocationTarget } = await user
        .toInstanceSupervisor(params)
        .getCapacityDetails();

      return {
        currentSubmissionCount: allProjects.length,
        submissionTarget: computeProjectSubmissionTarget(
          projectAllocationTarget,
          totalAllocatedCount,
        ),
        rowProjects: formatSupervisorRowProjects(allProjects),
      };
    }),

  /**
   * @version DAL
   */
  // ? same subGroupAdmin issue as above
  updateInstanceCapacities: procedure.instance.subgroupAdmin
    .input(
      z.object({
        params: instanceParamsSchema,
        supervisorId: z.string(),
        capacities: supervisorInstanceCapacitiesSchema,
      }),
    )
    .output(supervisorInstanceCapacitiesSchema)
    .mutation(
      async ({ ctx: { dal }, input: { params, supervisorId, capacities } }) =>
        await dal.supervisor.setCapacityDetails(
          supervisorId,
          capacities,
          params,
        ),
    ),

  /**
   * @version DAL
   */
  // ? same subGroupAdmin issue as above
  delete: procedure.instance.subgroupAdmin
    .input(z.object({ params: instanceParamsSchema, supervisorId: z.string() }))
    .mutation(
      async ({ ctx: { dal, instance }, input: { params, supervisorId } }) => {
        const stage = await instance.getStage();
        if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
          throw new Error("Cannot delete supervisor at this stage");
        }

        await dal.supervisor.delete(supervisorId, params);
      },
    ),

  /**
   * @version DAL
   */
  // ? same subGroupAdmin issue as above
  deleteSelected: procedure.instance.subgroupAdmin
    .input(
      z.object({
        params: instanceParamsSchema,
        supervisorIds: z.array(z.string()),
      }),
    )
    .mutation(
      async ({ ctx: { dal, instance }, input: { params, supervisorIds } }) => {
        const stage = await instance.getStage();
        if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
          throw new Error("Cannot delete supervisors at this stage");
        }

        await dal.supervisor.deleteMany(supervisorIds, params);
      },
    ),

  /**
   * @version DAL
   */
  allocations: procedure.instance.supervisor
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.array(supervisionAllocationDtoSchema))
    .query(async ({ ctx: { user }, input: { params } }) =>
      user.toInstanceSupervisor(params).getSupervisionAllocations(),
    ),
});
