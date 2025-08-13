import { z } from "zod";

import { flagDtoSchema, type SupervisorDTO, tagDtoSchema } from "@/dto";
import { projectDtoSchema } from "@/dto";
import { studentDtoSchema } from "@/dto";
import { supervisorDtoSchema } from "@/dto";
import { projectForm } from "@/dto/project";
import {
  PermissionResult,
  permissionResultSchema,
} from "@/dto/result/permission-result";

import {
  linkPreAllocatedStudent,
  linkProjectFlagIds,
  linkProjectTagIds,
} from "@/db/transactions/project-flags";
import { Transformers as T } from "@/db/transformers";
import { PreferenceType, Stage } from "@/db/types";
import { Role } from "@/db/types";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { expand, toPP2 } from "@/lib/utils/general/instance-params";
import {
  previousStages,
  subsequentStages,
} from "@/lib/utils/permissions/stage-check";

export const projectRouter = createTRPCRouter({
  exists: procedure.project.user
    .output(z.boolean())
    .query(async ({ ctx: { project } }) => await project.exists()),

  edit: procedure.project
    .inStage(previousStages(Stage.STUDENT_BIDDING))
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .input(z.object({ updatedProject: projectForm.editApiInputSchema }))
    .output(z.void())
    .mutation(
      async ({
        ctx: { db, project, audit },
        input: {
          updatedProject: {
            title,
            description,
            capacityUpperBound,
            preAllocatedStudentId,
            supervisorId,
            tagIds,
            flagIds,
          },
        },
      }) => {
        audit("Updated project", {
          data: {
            title,
            description,
            capacityUpperBound,
            preAllocatedStudentId,
            supervisorId,
            tagIds,
            flagIds,
          },
        });

        await db.$transaction(async (tx) => {
          await tx.project.update({
            where: toPP2(project.params),
            data: {
              title,
              description,
              capacityUpperBound,
              supervisorId,
              preAllocatedStudentId: preAllocatedStudentId ?? null,
              latestEditDateTime: new Date(),
            },
          });

          if (preAllocatedStudentId && preAllocatedStudentId.trim() !== "") {
            // ! would just override another pre-allocated student - bad probably
            await linkPreAllocatedStudent(
              tx,
              project.params,
              preAllocatedStudentId,
            );
          } else {
            const { preAllocatedStudentId } = await project.get();
            if (preAllocatedStudentId) {
              await tx.studentProjectAllocation.deleteMany({
                where: {
                  userId: preAllocatedStudentId,
                  projectId: project.params.projectId,
                },
              });
            }
          }

          if (flagIds.length > 0) {
            await linkProjectFlagIds(tx, project.params, flagIds);
          }

          if (tagIds.length > 0) {
            await linkProjectTagIds(tx, project.params, tagIds);
          }
        });
      },
    ),

  getAllForUser: procedure.instance.user
    .output(
      z.array(
        z.object({
          project: projectDtoSchema,
          supervisor: supervisorDtoSchema,
          preAllocatedStudentId: z.string().optional(),
        }),
      ),
    )
    .query(async ({ ctx: { instance, user } }) => {
      // if you are any kind of staff member, you should be able to see all projects
      // if you are a student, you should only be able to see projects that you are eligible for
      const projectData = await instance.getProjectDetails();

      if (await user.isStudent(instance.params)) {
        const student = await user.toStudent(instance.params);
        const { flag: studentFlag } = await student.get();

        // TODO: add pre-allocated project to top of list if such a project exists
        // otherwise, sort in alphabetical order
        return projectData
          .filter(
            (p) =>
              p.project.flags.map((f) => f.id).includes(studentFlag.id) &&
              (!p.allocatedStudent || p.allocatedStudent?.id === student.id),
          )
          .map((p) => ({
            project: p.project,
            supervisor: p.supervisor,
            preAllocatedStudentId: p.project.preAllocatedStudentId,
          }));
      }
      return projectData.map((p) => ({
        project: p.project,
        supervisor: p.supervisor,
        preAllocatedStudentId: p.project.preAllocatedStudentId,
      }));
    }),

  getAllLateProposals: procedure.instance.subGroupAdmin
    .output(z.array(projectDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getLateProjects()),

  getAllPreAllocated: procedure.instance
    .inStage(subsequentStages(Stage.PROJECT_SUBMISSION))
    .subGroupAdmin.output(
      z.array(
        z.object({
          project: projectDtoSchema,
          supervisor: supervisorDtoSchema,
          student: studentDtoSchema,
        }),
      ),
    )
    .query(async ({ ctx: { instance } }) => await instance.getPreAllocations()),

  getById: procedure.project.user
    .output(projectDtoSchema)
    .query(async ({ ctx: { db, project } }) => {
      // project.get
      const data = await db.project.findFirstOrThrow({
        where: toPP2(project.params),
        include: {
          supervisor: {
            include: { userInInstance: { include: { user: true } } },
          },
          flagsOnProject: { include: { flag: true } },
          tagsOnProject: { include: { tag: true } },
        },
      });

      return T.toProjectDTO(data);
    }),

  getByIdWithSupervisor: procedure.project.user
    .output(
      z.object({ project: projectDtoSchema, supervisor: supervisorDtoSchema }),
    )
    .query(async ({ ctx: { db, project } }) => {
      // project.get
      const data = await db.project.findFirstOrThrow({
        where: toPP2(project.params),
        include: {
          supervisor: {
            include: { userInInstance: { include: { user: true } } },
          },
          flagsOnProject: { include: { flag: true } },
          tagsOnProject: { include: { tag: true } },
        },
      });

      return {
        project: T.toProjectDTO(data),
        supervisor: T.toSupervisorDTO(data.supervisor),
      };
    }),

  // TODO: rename maybe? getStudentPreferencesForId
  getAllStudentPreferences: procedure.project.user
    .output(
      z.array(
        z.object({
          student: studentDtoSchema,
          preference: z.object({
            type: z.enum(PreferenceType).or(z.literal("SUBMITTED")),
            rank: z.number().optional(),
          }),
        }),
      ),
    )
    .query(async ({ ctx: { instance, project, db } }) => {
      const projectId = project.params.projectId;
      const studentPreferences = await instance.getStudentPreferenceDetails();

      const studentPreferenceMap = studentPreferences.reduce(
        (acc, val) => {
          const draft = val.draftPreferences
            .filter((x) => x.type === PreferenceType.PREFERENCE)
            .map((x) => x.projectId);

          return { ...acc, [val.student.id]: draft };
        },
        {} as Record<string, string[]>,
      );

      const hello = await db.project.findFirstOrThrow({
        where: toPP2(project.params),
        include: {
          inStudentDraftPreferences: {
            include: {
              student: {
                include: {
                  studentFlag: true,
                  userInInstance: { include: { user: true } },
                },
              },
            },
          },
          inStudentSubmittedPreferences: {
            include: {
              student: {
                include: {
                  studentFlag: true,
                  userInInstance: { include: { user: true } },
                },
              },
            },
          },
        },
      });

      const submittedPreferences = hello.inStudentSubmittedPreferences.map(
        (x) => ({
          student: T.toStudentDTO(x.student),
          preference: { type: "SUBMITTED" as const, rank: x.rank },
        }),
      );

      const draftPreferences = hello.inStudentDraftPreferences.map((x) => {
        const student = T.toStudentDTO(x.student);
        return {
          student,
          preference: {
            type: x.type,
            rank:
              x.type === PreferenceType.PREFERENCE
                ? studentPreferenceMap[x.student.userId].indexOf(projectId) + 1
                : undefined,
          },
        };
      });

      return [...submittedPreferences, ...draftPreferences];
    }),

  delete: procedure.project
    .inStage(previousStages(Stage.PROJECT_ALLOCATION))
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .output(permissionResultSchema)
    .mutation(async ({ ctx: { project, user, audit } }) => {
      audit("Delete project");
      if (await user.isSubGroupAdminOrBetter(project.params)) {
        await project.delete();
        return PermissionResult.OK;
      }

      if ((await project.get()).supervisorId === user.id) {
        await project.delete();
        return PermissionResult.OK;
      }

      return PermissionResult.UNAUTHORISED;
    }),

  deleteSelected: procedure.instance
    .inStage(previousStages(Stage.PROJECT_ALLOCATION))
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .input(z.object({ projectIds: z.array(z.string()) }))
    .output(z.array(permissionResultSchema))
    .mutation(
      async ({ ctx: { instance, user, audit }, input: { projectIds } }) => {
        audit("Delete projects", { projectIds });
        const isAdmin = await user.isSubGroupAdminOrBetter(instance.params);

        const checkedProjects = isAdmin
          ? projectIds.map((e) => ({ pid: e, res: true }))
          : await Promise.all(
              projectIds.map(async (e) => ({
                pid: e,
                res: await user.isProjectSupervisor(e),
              })),
            );

        await instance.deleteProjects(
          checkedProjects.filter(({ res }) => res).map(({ pid }) => pid),
        );

        return checkedProjects.map(({ res }) =>
          res ? PermissionResult.OK : PermissionResult.UNAUTHORISED,
        );
      },
    ),

  create: procedure.instance
    .inStage([Stage.PROJECT_SUBMISSION, Stage.STUDENT_BIDDING])
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .input(z.object({ newProject: projectForm.createApiInputSchema }))
    .output(z.string())
    .mutation(
      async ({ ctx: { instance, db, audit }, input: { newProject } }) => {
        audit("Create project", { project: newProject });

        return await db.$transaction(async (tx) => {
          const project = await tx.project.create({
            data: {
              ...expand(instance.params),
              title: newProject.title,
              description: newProject.description,
              capacityLowerBound: 0,
              capacityUpperBound: newProject.capacityUpperBound,
              preAllocatedStudentId: newProject.preAllocatedStudentId ?? null,
              latestEditDateTime: new Date(),
              supervisorId: newProject.supervisorId,
            },
          });

          if (
            newProject.preAllocatedStudentId &&
            newProject.preAllocatedStudentId.trim() !== ""
          ) {
            // ! would just override another pre-allocated student - bad probably
            await linkPreAllocatedStudent(
              tx,
              { ...instance.params, projectId: project.id },
              newProject.preAllocatedStudentId,
            );
          }

          await linkProjectFlagIds(
            tx,
            { ...instance.params, projectId: project.id },
            newProject.flagIds,
          );

          await linkProjectTagIds(
            tx,
            { ...instance.params, projectId: project.id },
            newProject.tagIds,
          );

          return project.id;
        });
      },
    ),

  getFormInitialisationData: procedure.instance.user
    .input(z.object({ projectId: z.string().optional() }))
    .output(
      z.object({
        takenTitles: z.set(z.string()),
        flags: z.array(flagDtoSchema),
        tags: z.array(tagDtoSchema),
        students: z.array(studentDtoSchema),
        supervisors: z.array(supervisorDtoSchema),
      }),
    )
    .query(async ({ ctx: { instance, user }, input: { projectId } }) => {
      const allProjects = await instance.getProjectDetails();
      const takenTitles = new Set(allProjects.map(({ project: p }) => p.title));

      const students = await instance.getUnallocatedStudents();

      if (projectId) {
        const project = instance.getProject(projectId);

        const { title } = await project.get();
        takenTitles.delete(title);

        // if the project has a pre-allocated student, we should allow them to be re-selected
        if (await project.hasPreAllocatedStudent()) {
          const preAllocatedStudent = await project.getPreAllocatedStudent();
          students.push(preAllocatedStudent);
        }
      }

      let supervisors: SupervisorDTO[] = [];
      if (await user.isSubGroupAdminOrBetter(instance.params)) {
        supervisors = await instance.getSupervisors();
      }

      return {
        takenTitles,
        flags: await instance.getFlags(),
        tags: await instance.getTags(),
        students,
        supervisors,
      };
    }),

  getAllocation: procedure.project.user
    .output(
      z.object({ student: studentDtoSchema, rank: z.number() }).optional(),
    )
    .query(async ({ ctx: { project, db } }) => {
      const allocation = await db.studentProjectAllocation.findFirst({
        where: { projectId: project.params.projectId },
        include: {
          student: {
            include: {
              userInInstance: { include: { user: true } },
              studentFlag: true,
            },
          },
        },
      });

      if (!allocation) return undefined;

      return {
        student: T.toStudentDTO(allocation.student),
        rank: allocation.studentRanking,
      };
    }),

  supervisorSubmissionInfo: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          supervisor: supervisorDtoSchema,
          submittedProjectsCount: z.number(),
          allocatedCount: z.number(),
          submissionTarget: z.number(),
          targetMet: z.boolean(),
        }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getSupervisorSubmissionDetails(),
    ),
});
