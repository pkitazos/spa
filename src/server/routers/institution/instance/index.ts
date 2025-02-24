import { Stage } from "@prisma/client";
import { z } from "zod";

import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import {
  createdInstanceSchema,
  forkedInstanceSchema,
  updatedInstanceSchema,
} from "@/lib/validations/instance-form";
import { instanceParamsSchema } from "@/lib/validations/params";
import { tabGroupSchema } from "@/lib/validations/tabs";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { mergeInstanceTrx } from "./_utils/merge/transaction";
import { algorithmRouter } from "./algorithm";
import { matchingRouter } from "./matching";
import { preferenceRouter } from "./preference";

import { PAGES } from "@/config/pages";
import { AllocationInstance } from "@/data-objects/spaces/instance";
import { forkInstanceTransaction } from "@/db/transactions/fork/transaction";
import { Role } from "@/db/types";
import { stageSchema } from "@/db/types";
import { instanceDtoSchema } from "@/dto";
import { LinkUserResult, LinkUserResultSchema } from "@/dto/link-user-result";
import { studentDtoSchema } from "@/dto/student";
import { supervisorDtoSchema } from "@/dto/supervisor";

const tgc = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  joined: z.boolean(),
  level: z.number(),
  preAllocated: z.boolean(),
});

// TODO: add stage checks to stage-specific procedures
export const instanceRouter = createTRPCRouter({
  matching: matchingRouter,
  algorithm: algorithmRouter,
  preference: preferenceRouter,

  /**
   * Check if an instance exists by ID
   */
  exists: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { instance } }) => await instance.exists()),

  /**
   * Get instance data by ID
   * @throws if the instance doesn't exist
   */
  get: procedure.instance.user
    .output(instanceDtoSchema)
    .query(async ({ ctx: { instance } }) => await instance.get()),

  /**
   * Returns the current stage of an instance with the ID provided
   * @throws if the instance doesn't exist
   */
  currentStage: procedure.instance.user
    .output(stageSchema)
    .query(async ({ ctx: { instance } }) => {
      const { stage } = await instance.get();
      return stage;
    }),

  /**
   * Set the current stage for the specified instance
   */
  setStage: procedure.instance.subGroupAdmin
    .input(z.object({ stage: stageSchema }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { stage } }) =>
        await instance.setStage(stage),
    ),

  // BREAKING returns undefined, and ID instead of alg name
  /**
   * Returns the ID and display name of the currently selected algorithm
   * return empty strings if none is selected
   */
  selectedAlgorithm: procedure.instance.subGroupAdmin
    .output(z.object({ id: z.string(), displayName: z.string() }).optional())
    .query(async ({ ctx: { instance } }) => {
      const alg = await instance.getSelectedAlg();

      if (!alg) return undefined;

      const { id, displayName } = await alg.get();
      return { id, displayName };
    }),

  // TODO do we have this schema (or parts of it) elsewhere?
  /**
   * return the allocations in this instance, in three views:
   * by student, by supervisor, and by project
   */
  projectAllocations: procedure.instance.subGroupAdmin
    .output(
      z.object({
        byStudent: z.array(
          z.object({
            student: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              ranking: z.number(),
            }),
            project: z.object({ id: z.string(), title: z.string() }),
            supervisor: z.object({ id: z.string(), name: z.string() }),
          }),
        ),
        byProject: z.array(
          z.object({
            project: z.object({
              id: z.string(),
              title: z.string(),
              capacityLowerBound: z.number(),
              capacityUpperBound: z.number(),
            }),
            supervisor: z.object({ id: z.string(), name: z.string() }),
            student: z.object({
              id: z.string(),
              name: z.string(),
              ranking: z.number(),
            }),
          }),
        ),
        bySupervisor: z.array(
          z.object({
            project: z.object({ id: z.string(), title: z.string() }),
            supervisor: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              allocationLowerBound: z.number(),
              allocationTarget: z.number(),
              allocationUpperBound: z.number(),
            }),
            student: z.object({
              id: z.string(),
              name: z.string(),
              ranking: z.number(),
            }),
          }),
        ),
      }),
    )
    .query(async ({ ctx }) => {
      const allocationData = await ctx.instance.getAllocationData();
      return allocationData.getViews();
    }),

  // TODO review usage of this
  // DEFINITELY it should use std. names
  // MAYBE kill it and use other gets?
  getEditFormDetails: procedure.instance.subGroupAdmin
    .output(
      createdInstanceSchema.extend({ parentInstanceId: z.string().optional() }),
    )
    .query(async ({ ctx: { instance } }) => {
      const data = await instance.get();
      const flags = await instance.getFlags();
      const tags = await instance.getTags();
      return {
        ...data,
        flags,
        tags,
        instanceName: data.displayName,
        minPreferences: data.minStudentPreferences,
        maxPreferences: data.maxStudentPreferences,
        maxPreferencesPerSupervisor: data.maxStudentPreferencesPerSupervisor,
        preferenceSubmissionDeadline: data.studentPreferenceSubmissionDeadline,
      };
    }),

  supervisors: procedure.instance.user
    .output(z.array(supervisorDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getSupervisors()),

  getSupervisors: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          institutionId: z.string(),
          fullName: z.string(),
          email: z.string(),
          projectTarget: z.number(),
          projectUpperQuota: z.number(),
        }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) => await instance.getSupervisorDetails(),
    ),

  // BREAKING input/output type changed
  addSupervisor: procedure.instance.subGroupAdmin
    .input(z.object({ newSupervisor: supervisorDtoSchema }))
    .output(LinkUserResultSchema)
    .mutation(
      async ({ ctx: { instance, institution }, input: { newSupervisor } }) => {
        if (await instance.isSupervisor(newSupervisor.id)) {
          return LinkUserResult.PRE_EXISTING;
        }

        const userExists = institution.userExists(newSupervisor.id);

        if (!userExists) institution.createUser(newSupervisor);

        await instance.linkUser(newSupervisor);
        await instance.linkSupervisor(newSupervisor);

        if (!userExists) return LinkUserResult.CREATED_NEW;
        else return LinkUserResult.OK;
      },
    ),

  // BREAKING input/output type changed
  addSupervisors: procedure.instance.subGroupAdmin
    .input(z.object({ newSupervisors: z.array(supervisorDtoSchema) }))
    .output(z.array(LinkUserResultSchema))
    .mutation(
      async ({ ctx: { instance, institution }, input: { newSupervisors } }) => {
        const existingSupervisorIds = await instance
          .getSupervisors()
          .then((data) => data.map(({ id }) => id));

        const existingUserIds = await institution
          .getUsers()
          .then((data) => data.map(({ id }) => id));

        await institution.createUsers(newSupervisors);

        await instance.linkUsers(newSupervisors);

        await instance.linkSupervisors(newSupervisors);

        return newSupervisors.map((s) => {
          if (existingSupervisorIds.includes(s.id)) {
            return LinkUserResult.PRE_EXISTING;
          }
          if (existingUserIds.includes(s.id)) {
            return LinkUserResult.CREATED_NEW;
          }
          return LinkUserResult.OK;
        });
      },
    ),

  // TODO: rename to e.g. Delete user in instance
  removeSupervisor: procedure.instance.subGroupAdmin
    .input(z.object({ supervisorId: z.string() }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { supervisorId } }) =>
        await instance.unlinkUser(supervisorId),
    ),

  removeSupervisors: procedure.instance.subGroupAdmin
    .input(z.object({ supervisorIds: z.array(z.string()) }))
    .output(z.void())
    .mutation(async ({ ctx: { instance }, input: { supervisorIds } }) =>
      instance.unlinkUsers(supervisorIds),
    ),

  invitedSupervisors: procedure.instance.subGroupAdmin
    .output(
      z.object({
        supervisors: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            joined: z.boolean(),
          }),
        ),
      }),
    )
    .query(async ({ ctx: { instance } }) => {
      const invitedUsers = await instance.getSupervisorDetails();

      return {
        supervisors: invitedUsers.map((u) => ({
          id: u.institutionId,
          name: u.fullName,
          email: u.email,
          joined: u.joined,
        })),
      };
    }),

  //  BREAKING output type changed
  students: procedure.instance.user
    .output(
      z.array(
        z.object({
          level: z.number(),
          projectAllocation: z
            .object({ id: z.string(), title: z.string() })
            .optional(),
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
      ),
    )
    .query(async ({ ctx: { instance } }) => {
      const studentData = await instance.getStudentAllocationDetails();

      return studentData.map((u) => ({
        id: u.institutionId,
        name: u.fullName,
        email: u.email,
        joined: u.joined,
        level: u.level,
        projectAllocation: u.allocatedProject,
      }));
    }),

  getStudents: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          institutionId: z.string(),
          fullName: z.string(),
          email: z.string(),
          level: z.number(),
        }),
      ),
    )
    .query(async ({ ctx: { instance } }) => await instance.getStudentDetails()),

  // BREAKING input/output types changed
  addStudent: procedure.instance.subGroupAdmin
    .input(z.object({ newStudent: studentDtoSchema }))
    .output(LinkUserResultSchema)
    .mutation(
      async ({ ctx: { instance, institution }, input: { newStudent } }) => {
        if (await instance.isStudent(newStudent.id)) {
          return LinkUserResult.PRE_EXISTING;
        }

        const userExists = institution.userExists(newStudent.id);

        if (!userExists) institution.createUser(newStudent);

        await instance.linkUser(newStudent);
        // TODO @pkitazos am I allowed to do this?
        await instance.linkStudents([newStudent]);

        if (!userExists) return LinkUserResult.CREATED_NEW;
        else return LinkUserResult.OK;
      },
    ),

  // BREAKING input/output types changed
  addStudents: procedure.instance.subGroupAdmin
    .input(z.object({ newStudents: z.array(studentDtoSchema) }))
    .output(z.array(LinkUserResultSchema))
    .mutation(
      async ({ ctx: { instance, institution }, input: { newStudents } }) => {
        const existingStudentIds = await instance
          .getStudents()
          .then((data) => data.map(({ id }) => id));

        const existingUserIds = await institution
          .getUsers()
          .then((data) => data.map(({ id }) => id));

        await institution.createUsers(newStudents);

        await instance.linkUsers(newStudents);

        await instance.linkStudents(newStudents);

        return newStudents.map((s) => {
          if (existingStudentIds.includes(s.id)) {
            return LinkUserResult.PRE_EXISTING;
          }
          if (existingUserIds.includes(s.id)) {
            return LinkUserResult.CREATED_NEW;
          }
          return LinkUserResult.OK;
        });
      },
    ),

  removeStudent: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx: { instance }, input: { studentId } }) => {
      await instance.unlinkStudent(studentId);
    }),

  removeStudents: procedure.instance.subGroupAdmin
    .input(z.object({ studentIds: z.array(z.string()) }))
    .output(z.void())
    .mutation(async ({ ctx: { instance }, input: { studentIds } }) => {
      await instance.unlinkStudents(studentIds);
    }),

  invitedStudents: procedure.instance.subGroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .output(
      z.object({
        all: z.array(tgc),
        incomplete: z.array(tgc),
        preAllocated: z.array(tgc),
      }),
    )
    .query(async ({ ctx: { instance } }) => {
      const invitedStudents = await instance.getStudentDetails();

      const preAllocatedStudents = await instance.getPreAllocatedStudentIds();

      const all = invitedStudents.map((u) => ({
        id: u.institutionId,
        name: u.fullName,
        email: u.email,
        joined: u.joined,
        level: u.level,
        preAllocated: preAllocatedStudents.has(u.institutionId),
      }));

      return {
        all,
        incomplete: all.filter((s) => !s.joined && !s.preAllocated),
        preAllocated: all.filter((s) => s.preAllocated),
      };
    }),

  edit: procedure.instance.subGroupAdmin
    .input(z.object({ updatedInstance: updatedInstanceSchema }))
    .output(z.void())
    .mutation(async ({ ctx: { instance }, input: { updatedInstance } }) => {
      instance.edit(updatedInstance);
    }),

  getHeaderTabs: procedure.user
    .input(z.object({ params: instanceParamsSchema.partial() }))
    .query(async ({ ctx, input }) => {
      const result = instanceParamsSchema.safeParse(input.params);

      // TODO consider moving this control flow to client
      if (!result.success) return { headerTabs: [], instancePath: "" };

      const instance = new AllocationInstance(ctx.dal, ctx.db, result.data);

      const instanceData = await instance.get();

      const roles = await ctx.user.getRolesInInstance(instance.params);

      const instancePath = formatParamsAsPath(instance.params);

      if (!roles.has(Role.ADMIN)) {
        return {
          headerTabs: [PAGES.instanceHome, PAGES.allProjects],
          instancePath,
        };
      }

      const adminTabs = [PAGES.allSupervisors, PAGES.allStudents];

      const headerTabs =
        instanceData.stage === Stage.SETUP
          ? [PAGES.instanceHome, ...adminTabs]
          : [PAGES.instanceHome, PAGES.allProjects, ...adminTabs];

      return { headerTabs, instancePath };
    }),

  getSidePanelTabs: procedure.instance.user
    .output(z.array(tabGroupSchema))
    .query(async ({ ctx: { instance, user } }) => {
      const { stage } = await instance.get();
      const roles = await user.getRolesInInstance(instance.params);
      const preAllocatedProject = await user.hasSelfDefinedProject(
        instance.params,
      );

      const tabGroups = [];

      if (roles.has(Role.ADMIN)) {
        tabGroups.push({
          title: "Admin",
          tabs: [PAGES.stageControl, PAGES.settings],
        });

        tabGroups.push({
          title: "Stage-specific",
          tabs: await instance.getAdminTabs(),
        });
      }

      if (roles.has(Role.SUPERVISOR)) {
        const isSecondRole = roles.size > 1;
        const supervisorTabs = await instance.getSupervisorTabs();

        if (!isSecondRole) {
          supervisorTabs.unshift(PAGES.instanceTasks);
        } else if (stage !== Stage.SETUP) {
          supervisorTabs.unshift(PAGES.supervisorTasks);
        }

        tabGroups.push({ title: "Supervisor", tabs: supervisorTabs });
      }

      if (roles.has(Role.STUDENT)) {
        const isSecondRole = roles.size > 1;
        const studentTabs = await instance.getStudentTabs(!preAllocatedProject);

        tabGroups.push({
          title: "Student",
          tabs: isSecondRole
            ? studentTabs
            : [PAGES.instanceTasks, ...studentTabs],
        });
      }

      return tabGroups;
    }),

  // Pin
  fork: procedure.instance
    .inStage([Stage.ALLOCATION_PUBLICATION])
    .subGroupAdmin.input(z.object({ newInstance: forkedInstanceSchema }))
    .output(z.void())
    .mutation(async ({ ctx, input: { params, newInstance: forked } }) => {
      await forkInstanceTransaction(ctx.db, forked, params);
    }),

  // Pin
  merge: procedure.instance.subGroupAdmin
    .output(z.void())
    .mutation(async ({ ctx, input: { params } }) => {
      await mergeInstanceTrx(ctx.db, params);
    }),

  // TODO rename? e.g. getFlagTitles
  getFlags: procedure.instance.user
    .output(z.array(z.string()))
    .query(async ({ ctx: { instance } }) => {
      const flags = await instance.getFlags();
      return flags.map((f) => f.title);
    }),
});
