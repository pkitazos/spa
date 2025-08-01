import { z } from "zod";

import { studentDtoSchema } from "@/dto";
import { projectDtoSchema, supervisorDtoSchema } from "@/dto";

import { Supervisor } from "@/data-objects";

import { Stage } from "@/db/types";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { getGMTOffset, getGMTZoned } from "@/lib/utils/date/timezone";
import { stageGte } from "@/lib/utils/permissions/stage-check";

import { preferenceRouter } from "./preference";

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
      z.object({
        student: studentDtoSchema,
        selfDefinedProjectId: z.string().optional(),
        allocation: z
          .object({
            project: projectDtoSchema,
            supervisor: supervisorDtoSchema,
            studentRanking: z.number(),
          })
          .optional(),
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
          student: studentData,
        };
      }

      // definitely has allocation
      const { project, supervisor, studentRanking } =
        await student.getAllocation();

      if (!(await student.hasSelfDefinedProject())) {
        // no self defined project
        return {
          allocation: { project, supervisor, studentRanking },
          selfDefinedProjectId: undefined,
          student: studentData,
        };
      }

      // definitely has self defined project
      return {
        allocation: { project, supervisor, studentRanking },
        selfDefinedProjectId: project.id,
        student: studentData,
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
  // ! deprecated
  updateLevel: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string(), level: z.number() }))
    .output(studentDtoSchema)
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

  getPreAllocation: procedure.instance.student
    .output(
      z.object({
        project: projectDtoSchema,
        supervisor: supervisorDtoSchema,
        studentRanking: z.number(),
      }),
    )
    .query(async ({ ctx: { user } }) => await user.getAllocation()),

  // MOVE to instance router
  // this sucks actually
  preferenceRestrictions: procedure.instance.user
    .output(
      z.object({
        minPreferences: z.number(),
        maxPreferences: z.number(),
        maxPreferencesPerSupervisor: z.number(),
        preferenceSubmissionDeadline: z.date(),
      }),
    )
    .query(async ({ ctx: { instance } }) => {
      // ? should this be a method on the instance object
      const data = await instance.get();

      return {
        minPreferences: data.minStudentPreferences,
        maxPreferences: data.maxStudentPreferences,
        maxPreferencesPerSupervisor: data.maxStudentPreferencesPerSupervisor,
        preferenceSubmissionDeadline: data.studentPreferenceSubmissionDeadline,
      };
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
    .query(async ({ ctx: { db, instance }, input: { studentId } }) => {
      if (!(await instance.isStudent(studentId))) return undefined;

      const student = await instance.getStudent(studentId);

      if (!(await student.hasAllocation())) return undefined;

      const { project, studentRanking } = await student.getAllocation();

      const supervisor = new Supervisor(
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

      await instance.unlinkStudent(studentId);
    }),

  // TODO naming inconsistency (see supervisor deleteMany)
  deleteSelected: procedure.instance.subGroupAdmin
    .input(z.object({ studentIds: z.array(z.string()) }))
    .mutation(async ({ ctx: { instance }, input: { studentIds } }) => {
      const { stage } = await instance.get();
      if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
        throw new Error("Cannot delete students at this stage");
      }

      await instance.unlinkStudents(studentIds);
    }),

  getSuitableProjects: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(z.array(projectDtoSchema))
    .query(async ({ ctx: { instance }, input: { studentId } }) => {
      const student = await instance.getStudent(studentId);
      const { flag: studentFlag } = await student.get();
      const preferences = await student.getAllDraftPreferences();
      const preferenceIds = new Set(preferences.map(({ project: p }) => p.id));

      const projectData = await instance.getProjectDetails();

      return projectData
        .filter((p) => {
          if (preferenceIds.has(p.project.id)) return false;
          return p.project.flags.map((f) => f.id).includes(studentFlag.id);
        })
        .map(({ project }) => project);
    }),
});
