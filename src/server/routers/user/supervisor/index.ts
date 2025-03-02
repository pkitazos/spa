import { z } from "zod";

import { getGMTOffset, getGMTZoned } from "@/lib/utils/date/timezone";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";
import { instanceParamsSchema } from "@/lib/validations/params";
import { supervisorCapacitiesSchema } from "@/lib/validations/supervisor-project-submission-details";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { computeProjectSubmissionTarget } from "@/config/submission-target";
import { Stage } from "@/db/types";
import {
  ProjectDTO,
  projectDtoSchema,
  StudentDTO,
  studentDtoSchema,
  supervisorDtoSchema,
  userDtoSchema,
} from "@/dto";

export const supervisorRouter = createTRPCRouter({
  exists: procedure.instance.user
    .input(z.object({ supervisorId: z.string() }))
    .output(z.boolean())
    .query(
      async ({ ctx: { instance }, input: { supervisorId } }) =>
        await instance.isSupervisor(supervisorId),
    ),

  allocationAccess: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { instance } }) => {
      const { supervisorAllocationAccess } = await instance.get();
      return supervisorAllocationAccess;
    }),

  // TODO stage check?
  setAllocationAccess: procedure.instance.subGroupAdmin
    .input(z.object({ access: z.boolean() }))
    .output(z.boolean())
    .mutation(
      async ({ ctx: { instance }, input: { access } }) =>
        await instance.setSupervisorPublicationAccess(access),
    ),

  // TODO split to e.g. displayname and DeadlineDetails
  // TODO rename
  // MOVE to instance router
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
  // MOVE to instance router
  instanceData: procedure.instance.subGroupAdmin
    .input(z.object({ supervisorId: z.string() }))
    .output(
      // TODO compose don't extend
      z.object({
        supervisor: supervisorDtoSchema,
        projects: z.array(
          projectDtoSchema.extend({
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
          (acc, val) => (val.project.preAllocatedStudentId ? acc + 1 : acc),
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

  // BREAKING output type
  rowProjects: procedure.instance.supervisor
    .output(
      z.array(
        z.object({
          project: projectDtoSchema,
          student: studentDtoSchema.or(z.undefined()),
        }),
      ),
    )
    .query(async ({ ctx: { user } }) => {
      type Ret = { project: ProjectDTO; student: StudentDTO | undefined }[];
      const supervisorProjects = await user.getProjects();

      return supervisorProjects.flatMap((p) => {
        if (p.allocatedStudents.length === 0) {
          return [{ project: p.project, student: undefined }] as Ret;
        }

        return p.allocatedStudents.map((s) => ({
          project: p.project,
          student: s,
        })) as Ret;
      });
    }),

  updateInstanceCapacities: procedure.instance.subGroupAdmin
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

  delete: procedure.instance
    .inStage(subsequentStages(Stage.PROJECT_ALLOCATION))
    .subGroupAdmin.input(z.object({ supervisorId: z.string() }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { supervisorId } }) =>
        await instance.deleteSupervisor(supervisorId),
    ),

  deleteMany: procedure.instance
    .inStage(subsequentStages(Stage.PROJECT_ALLOCATION))
    .subGroupAdmin.input(z.object({ supervisorIds: z.array(z.string()) }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { supervisorIds } }) =>
        await instance.deleteSupervisors(supervisorIds),
    ),

  // BREAKING output type
  allocations: procedure.instance.supervisor
    .output(
      z.array(
        z.object({
          project: projectDtoSchema,
          student: studentDtoSchema,
          rank: z.number(),
        }),
      ),
    )
    .query(async ({ ctx: { user } }) => user.getSupervisionAllocations()),
});
