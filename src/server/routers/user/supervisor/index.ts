import { z } from "zod";

import { getGMTOffset, getGMTZoned } from "@/lib/utils/date/timezone";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { instanceParamsSchema } from "@/lib/validations/params";
import { supervisorInstanceCapacitiesSchema } from "@/lib/validations/supervisor-project-submission-details";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { computeProjectSubmissionTarget } from "@/server/utils/instance/submission-target";

import { formatSupervisorRowProjects } from "./_utils/supervisor-row-projects";

import { User } from "@/data-objects/users/user";
import { Stage } from "@/db/types";
import {
  project__AllocatedStudents_Flags_Tags_Schema,
  project__Capacities_Schema,
  supervisionAllocationDtoSchema,
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
    .query(
      async ({ ctx: { instance } }) =>
        (await instance.get()).supervisorAllocationAccess,
    ),

  setAllocationAccess: procedure.instance.subgroupAdmin
    .input(z.object({ params: instanceParamsSchema, access: z.boolean() }))
    .output(z.boolean())
    .mutation(
      async ({ ctx: { instance }, input: { access } }) =>
        await instance.setSupervisorAccess(access),
    ),

  // TODO rename
  // TODO split
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

  instanceData: procedure.instance.subgroupAdmin
    .input(z.object({ supervisorId: z.string() }))
    .output(
      // TODO review output type here
      z.object({
        supervisor: supervisorDtoSchema,
        projects: z.array(project__AllocatedStudents_Flags_Tags_Schema),
      }),
    )
    .query(
      async ({ ctx: { dal }, input: { params, supervisorId } }) =>
        // TODO put this method on instance obj
        await dal.supervisor.getInstanceData(supervisorId, params),
    ),

  // ? not sure about the output schema definition here
  // TODO consider renaming e.g. projectStats?
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
      const parentInstanceId = (await instance.get()).parentInstanceId;

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

      const { projectTarget: projectAllocationTarget } =
        await user.getCapacityDetails();

      return {
        currentSubmissionCount: allProjects.length,
        submissionTarget: computeProjectSubmissionTarget(
          projectAllocationTarget,
          totalAllocatedCount,
        ),
        rowProjects: formatSupervisorRowProjects(allProjects),
      };
    }),

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
        // TODO move onto instance object
        await dal.supervisor.setCapacityDetails(
          supervisorId,
          capacities,
          params,
        ),
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

  deleteSelected: procedure.instance.subgroupAdmin
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

  allocations: procedure.instance.supervisor
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.array(supervisionAllocationDtoSchema))
    .query(async ({ ctx: { user } }) => user.getSupervisionAllocations()),
});
