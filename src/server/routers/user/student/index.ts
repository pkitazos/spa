import { Stage } from "@prisma/client";
import { z } from "zod";

import { getGMTOffset, getGMTZoned } from "@/lib/utils/date/timezone";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import {
  randomAllocationDtoSchema,
  studentProjectAllocationDtoSchema,
} from "@/lib/validations/allocation/data-table-dto";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { preferenceRouter } from "./preference";

import { InstanceStudent } from "@/data-objects/users/instance-student";
import { InstanceSupervisor } from "@/data-objects/users/instance-supervisor";
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
      async ({ ctx: { instance }, input: { studentId } }) =>
        await instance.isStudent(studentId),
    ),

  // TODO: change output
  getById: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(
      studentDtoSchema.extend({
        selfDefinedProjectId: z.string().optional(),
        allocation: studentProjectAllocationDtoSchema.optional(),
      }),
    )
    .query(async ({ ctx: { instance }, input: { studentId } }) => {
      const student = await instance.getStudent(studentId);
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
      const supervisor = await instance
        .getSupervisor(project.supervisorId)
        .get();

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

  // MOVE to instance router
  allocationAccess: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { instance } }) => {
      const { studentAllocationAccess } = await instance.get();
      return studentAllocationAccess;
    }),

  // MOVE to instance router
  setAllocationAccess: procedure.instance.subGroupAdmin
    .input(z.object({ access: z.boolean() }))
    .output(z.boolean())
    .mutation(async ({ ctx: { instance }, input: { access } }) =>
      instance.setStudentPublicationAccess(access),
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

  // MOVE to instance router (a lot of these operations should really be on the instance object)
  // they can also be on the student object and just use the same underlying dal methods
  // maybe not
  updateLevel: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string(), level: z.number() }))
    .output(studentDetailsDtoSchema)
    .mutation(async ({ ctx: { instance }, input: { studentId, level } }) => {
      const student = await instance.getStudent(studentId);
      return student.setStudentLevel(level);
    }),

  // Can anyone see this?
  latestSubmission: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(z.date().optional())
    .query(async ({ ctx: { instance }, input: { studentId } }) => {
      const student = await instance.getStudent(studentId);
      return student.getLatestSubmissionDateTime();
    }),

  // BREAKING output type
  isPreAllocated: procedure.instance.student
    .output(z.boolean())
    .query(async ({ ctx: { user } }) => await user.hasSelfDefinedProject()),

  // MOVE to instance router
  // this sucks actually
  preferenceRestrictions: procedure.instance.user
    .output(studentPreferenceRestrictionsDtoSchema)
    .query(
      async ({ ctx: { instance } }) =>
        // ? should this be a method on the instance object
        await instance.get().then(instanceToStudentPreferenceRestrictionsDTO),
    ),

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
    .query(async ({ ctx: { dal, db, instance }, input: { studentId } }) => {
      const student = new InstanceStudent(dal, db, studentId, instance.params);

      if (!(await student.hasAllocation())) return undefined;

      const { project, studentRanking } = await student.getAllocation();

      const supervisor = new InstanceSupervisor(
        dal,
        db,
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

  delete: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .mutation(async ({ ctx: { instance }, input: { studentId } }) => {
      const { stage } = await instance.get();
      if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
        throw new Error("Cannot delete student at this stage");
      }

      await instance.deleteStudent(studentId);
    }),

  // TODO naming inconsistency (see supervisor deleteMany)
  deleteSelected: procedure.instance.subGroupAdmin
    .input(z.object({ studentIds: z.array(z.string()) }))
    .mutation(async ({ ctx: { instance }, input: { studentIds } }) => {
      const { stage } = await instance.get();
      if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
        throw new Error("Cannot delete students at this stage");
      }

      await instance.deleteStudents(studentIds);
    }),

  // MOVE to instance router
  getUnallocated: procedure.instance.subGroupAdmin
    .output(z.array(randomAllocationDtoSchema).optional())
    .query(async ({ ctx: { instance } }) => {
      const { selectedAlgConfigId } = await instance.get();
      if (!selectedAlgConfigId) return;
      return await instance.getUnallocatedStudents();
    }),
});
