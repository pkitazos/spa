import { Stage } from "@prisma/client";
import { z } from "zod";

import { getGMTOffset, getGMTZoned } from "@/lib/utils/date/timezone";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { studentProjectAllocationDtoSchema } from "@/lib/validations/allocation/data-table-dto";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { getUnallocatedStudents } from "@/server/utils/instance/unallocated-students";

import { preferenceRouter } from "./preference";

import { InstanceStudent } from "@/data-objects/users/instance-student";
import { InstanceSupervisor } from "@/data-objects/users/instance-supervisor";
import { User } from "@/data-objects/users/user";
import { instanceToStudentPreferenceRestrictionsDTO } from "@/db/transformers";
import {
  studentDetailsDtoSchema,
  studentDtoSchema,
  studentPreferenceRestrictionsDtoSchema,
} from "@/dto/student";

export const studentRouter = createTRPCRouter({
  preference: preferenceRouter,

  exists: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(z.boolean())
    .query(
      async ({ ctx: { instance, dal }, input: { studentId } }) =>
        await new User(dal, studentId).isInstanceStudent(instance.params),
    ),

  // TODO: change output
  getById: procedure.instance.subgroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(
      studentDtoSchema.extend({
        selfDefinedProjectId: z.string().optional(),
        allocation: studentProjectAllocationDtoSchema.optional(),
      }),
    )
    .query(async ({ ctx: { dal, instance }, input: { studentId } }) => {
      const student = new InstanceStudent(dal, studentId, instance.params);
      const studentData = await student.get();

      if (!(await student.hasAllocation())) {
        // no allocation
        return {
          allocation: undefined,
          selfDefinedProjectId: undefined,
          ...studentData,
        };
      }

      // definitely has allocation
      const { project, studentRanking } = await student.getAllocation();
      const supervisor = await new InstanceSupervisor(
        dal,
        project.supervisorId,
        instance.params,
      ).get();

      if (!(await student.hasSelfDefinedProject())) {
        // no self defined project
        return {
          allocation: {
            project: { id: project.id, title: project.title, supervisor },
            rank: studentRanking,
          },
          selfDefinedProjectId: undefined,
          ...studentData,
        };
      }

      // definitely has self defined project

      return {
        id: studentData.id,
        name: studentData.name,
        email: studentData.email,
        level: studentData.level,
        latestSubmissionDateTime: studentData.latestSubmissionDateTime,

        selfDefinedProjectId: project.id,
        allocation: {
          project: { id: project.id, title: project.title, supervisor },
          rank: studentRanking,
        },
      };
    }),

  // TODO: move to instance router
  allocationAccess: procedure.instance.user
    .output(z.boolean())
    .query(
      async ({ ctx: { instance } }) =>
        await instance.get().then((x) => x.studentAllocationAccess),
    ),

  // TODO: move to instance router
  setAllocationAccess: procedure.instance.subgroupAdmin
    .input(z.object({ access: z.boolean() }))
    .output(z.boolean())
    .mutation(async ({ ctx: { instance }, input: { access } }) =>
      instance.setStudentAccess(access),
    ),

  // TODO rename + split
  overviewData: procedure.instance.student.query(
    async ({ ctx: { instance } }) => {
      const { displayName, studentPreferenceSubmissionDeadline: deadline } =
        await instance.get();

      return {
        displayName,
        preferenceSubmissionDeadline: getGMTZoned(deadline),
        deadlineTimeZoneOffset: getGMTOffset(deadline),
      };
    },
  ),

  updateLevel: procedure.instance.subgroupAdmin
    .input(
      z.object({
        studentId: z.string(),
        level: z.number(),
      }),
    )
    .output(studentDetailsDtoSchema)
    .mutation(
      async ({ ctx: { dal, instance }, input: { studentId, level } }) => {
        return await new InstanceStudent(
          dal,
          studentId,
          instance.params,
        ).setStudentLevel(level);
      },
    ),

  isPreAllocated: procedure.instance.student
    .output(z.boolean())
    .query(async ({ ctx: { user } }) => {
      const student = user;
      return await student.hasSelfDefinedProject();
    }),

  // TODO: move to instance router
  preferenceRestrictions: procedure.instance.user
    .output(studentPreferenceRestrictionsDtoSchema)
    .query(
      async ({ ctx: { instance } }) =>
        await instance.get().then(instanceToStudentPreferenceRestrictionsDTO),
    ),

  latestSubmission: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(z.date().optional())
    .query(async ({ ctx: { dal, instance }, input: { studentId } }) => {
      return await new InstanceStudent(
        dal,
        studentId,
        instance.params,
      ).getLatestSubmissionDateTime();
    }),

  // TODO: change output type
  // TODO: split into two procedures
  getAllocatedProject: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(
      z
        .object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          studentRanking: z.number(),
          supervisor: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
          }),
        })
        .optional(),
    )
    .query(async ({ ctx: { dal, instance }, input: { studentId } }) => {
      const student = new InstanceStudent(dal, studentId, instance.params);

      if (!(await student.hasAllocation())) return undefined;

      const { project, studentRanking } = await student.getAllocation();

      const supervisor = new InstanceSupervisor(
        dal,
        project.supervisorId,
        instance.params,
      );

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        studentRanking,
        supervisor: await supervisor.get(),
      };
    }),

  delete: procedure.instance.subgroupAdmin
    .input(z.object({ studentId: z.string() }))
    .mutation(async ({ ctx: { instance }, input: { studentId } }) => {
      const { stage } = await instance.get();
      if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
        throw new Error("Cannot delete student at this stage");
      }

      await instance.deleteStudent(studentId);
    }),

  deleteSelected: procedure.instance.subgroupAdmin
    .input(z.object({ studentIds: z.array(z.string()) }))
    .mutation(async ({ ctx: { instance }, input: { studentIds } }) => {
      const { stage } = await instance.get();
      if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
        throw new Error("Cannot delete students at this stage");
      }

      await instance.deleteStudents(studentIds);
    }),

  // TODO: move to instance router
  getUnallocated: procedure.instance.subgroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .output(
      z
        .array(
          z.object({
            student: z.object({
              level: z.number(),
              id: z.string(),
              name: z.string(),
              email: z.string(),
            }),
            project: z
              .object({
                projectId: z.string(),
                allocationGroupId: z.string(),
                allocationSubGroupId: z.string(),
                allocationInstanceId: z.string(),
                supervisorId: z.string(),
              })
              .optional(),
          }),
        )
        .optional(),
    )
    .query(async ({ ctx: { dal, instance } }) => {
      const { selectedAlgName } = await instance.get();
      if (!selectedAlgName) return;

      //  TODO: this needs to be moved to the dal
      return await getUnallocatedStudents(
        dal.db,
        instance.params,
        selectedAlgName,
      );
    }),
});
