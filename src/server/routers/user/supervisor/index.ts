import { z } from "zod";

import { getGMTOffset, getGMTZoned } from "@/lib/utils/date/timezone";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { instanceParamsSchema } from "@/lib/validations/params";
import { supervisorCapacitiesSchema } from "@/lib/validations/supervisor-project-submission-details";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { computeProjectSubmissionTarget } from "@/server/utils/instance/submission-target";

import { formatSupervisorRowProjects } from "./_utils/supervisor-row-projects";

import { User } from "@/data-objects/users/user";
import { Stage } from "@/db/types";
import { flagDtoSchema, tagDtoSchema, userDtoSchema } from "@/dto";
import { studentDtoSchema } from "@/dto/student";
import {
  baseProjectDtoSchema,
  supervisorDtoSchema,
} from "@/dto/supervisor_router";

export const supervisorRouter = createTRPCRouter({
  exists: procedure.instance.user
    .input(z.object({ supervisorId: z.string() }))
    .output(z.boolean())
    .query(
      async ({ ctx: { dal }, input: { supervisorId, params } }) =>
        await new User(dal, supervisorId).isInstanceSupervisor(params),
    ),

  allocationAccess: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { instance } }) => {
      const { supervisorAllocationAccess } = await instance.get();
      return supervisorAllocationAccess;
    }),

  setAllocationAccess: procedure.instance.subgroupAdmin
    .input(z.object({ access: z.boolean() }))
    .output(z.boolean())
    .mutation(
      async ({ ctx: { instance }, input: { access } }) =>
        await instance.setSupervisorAccess(access),
    ),

  // TODO split to e.g. displayname and DeadlineDetails
  // TODO move
  // TODO rename
  instancePage: procedure.instance.supervisor
    .input(z.object({ params: instanceParamsSchema }))
    .output(
      z.object({
        displayName: z.string(),
        // TODO make DTO for below
        deadlineTimeZoneOffset: z.string(),
        projectSubmissionDeadline: z.date(),
      }),
    )
    .query(async ({ ctx: { instance } }) => {
      const { displayName, projectSubmissionDeadline } = await instance.get();

      return {
        displayName,
        deadlineTimeZoneOffset: getGMTOffset(projectSubmissionDeadline),
        projectSubmissionDeadline: getGMTZoned(projectSubmissionDeadline),
      };
    }),

  // TODO rename
  // TODO change output schema
  // TODO move to instance router
  instanceData: procedure.instance.subgroupAdmin
    .input(z.object({ supervisorId: z.string() }))
    .output(
      // TODO compose don't extend
      z.object({
        supervisor: supervisorDtoSchema,
        projects: z.array(
          baseProjectDtoSchema.extend({
            tags: z.array(tagDtoSchema),
            flags: z.array(flagDtoSchema),
            allocatedStudents: z.array(userDtoSchema),
          }),
        ),
      }),
    )
    .query(async ({ ctx: { instance }, input: { supervisorId } }) => {
      const supervisor = instance.getSupervisor(supervisorId);
      return {
        supervisor: await supervisor.toDTO(),
        projects: await supervisor.getProjectsWithDetails(),
      };
    }),

  // ? not sure about the output schema definition here
  // TODO consider renaming e.g. projectStats?
  // TODO split
  projectStats: procedure.instance.supervisor
    .output(
      z.object({
        currentSubmissionCount: z.number(),
        submissionTarget: z.number(),
      }),
    )
    .query(async ({ ctx: { instance, user } }) => {
      const { parentInstanceId } = await instance.get();

      // TODO: this call returns allocated students and it does not have to
      // so the name is lying here
      const allProjects = await user.getProjects();
      const { projectTarget: target } = await user.getCapacityDetails();

      let totalCount: number;
      if (parentInstanceId) {
        const forkedPreAllocatedCount = allProjects.reduce(
          (acc, val) => (val.preAllocatedStudentId ? acc + 1 : acc),
          0,
        );

        const parentCount =
          await user.countAllocationsInParent(parentInstanceId);

        totalCount = forkedPreAllocatedCount + parentCount;
      } else {
        totalCount = await user
          .getSupervisionAllocations()
          .then((allocations) => allocations.length);
      }

      return {
        currentSubmissionCount: allProjects.length,
        submissionTarget: computeProjectSubmissionTarget(target, totalCount),
      };
    }),

  rowProjects: procedure.instance.supervisor
    .output(
      z.array(
        // TODO Refactor this?
        baseProjectDtoSchema.extend({
          capacityLowerBound: z.number(),
          capacityUpperBound: z.number(),
          allocatedStudentId: z.string().optional(),
          allocatedStudentName: z.string().optional(),
        }),
      ),
    )
    .query(
      async ({ ctx: { user } }) =>
        await user.getProjects().then(formatSupervisorRowProjects),
    ),

  updateInstanceCapacities: procedure.instance.subgroupAdmin
    .input(
      z.object({
        supervisorId: z.string(),
        capacities: supervisorCapacitiesSchema,
      }),
    )
    .output(supervisorCapacitiesSchema)
    .mutation(
      async ({ ctx: { instance }, input: { supervisorId, capacities } }) =>
        await instance
          .getSupervisor(supervisorId)
          .setCapacityDetails(capacities),
    ),

  delete: procedure.instance.subgroupAdmin
    .input(z.object({ supervisorId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx: { instance }, input: { supervisorId } }) => {
      const { stage } = await instance.get();
      if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
        throw new Error("Cannot delete supervisor at this stage");
      }

      await instance.deleteSupervisor(supervisorId);
    }),

  deleteMany: procedure.instance.subgroupAdmin
    .input(
      z.object({
        params: instanceParamsSchema,
        supervisorIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx: { instance }, input: { supervisorIds } }) => {
      const { stage } = await instance.get();
      if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
        throw new Error("Cannot delete supervisors at this stage");
      }

      await instance.deleteSupervisors(supervisorIds);
    }),

  // TODO: fix on client
  allocations: procedure.instance.supervisor
    .input(z.object({ params: instanceParamsSchema }))
    .output(
      z.array(
        z.object({
          project: baseProjectDtoSchema,
          student: studentDtoSchema,
          rank: z.number(),
        }),
      ),
    )
    .query(async ({ ctx: { user } }) => user.getSupervisionAllocations()),
});
