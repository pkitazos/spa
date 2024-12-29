import { Role, Stage } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { z } from "zod";

import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { expand } from "@/lib/utils/general/instance-params";
import { setDiff } from "@/lib/utils/general/set-difference";
import {
  newStudentSchema,
  newSupervisorSchema,
} from "@/lib/validations/add-users/new-user";
import {
  allocationByProjectDtoSchema,
  allocationByStudentDtoSchema,
  allocationBySupervisorDtoSchema,
} from "@/lib/validations/allocation/data-table-dto";
import {
  forkedInstanceSchema,
  updatedInstanceSchema,
} from "@/lib/validations/instance-form";
import { instanceParamsSchema } from "@/lib/validations/params";
import { studentStages, supervisorStages } from "@/lib/validations/stage";
import { studentLevelSchema } from "@/lib/validations/student-level";
import { getTabs } from "@/lib/validations/tabs/side-panel";

import {
  createTRPCRouter,
  instanceAdminProcedure,
  instanceProcedure,
  multiRoleAwareProcedure,
  protectedProcedure,
  roleAwareProcedure,
} from "@/server/trpc";
import { checkAdminPermissions } from "@/server/utils/admin/access";
import { validateEmailGUIDMatch } from "@/server/utils/id-email-check";
import { getInstance } from "@/server/utils/instance";
import { getUserRole } from "@/server/utils/instance/user-role";

import { hasSelfDefinedProject } from "../../user/_utils/get-self-defined-project";

import { addStudentsTx } from "./_utils/add-students-transaction";
import { addSupervisorsTx } from "./_utils/add-supervisors-transaction";
import { getAllAllocationData } from "./_utils/allocation-data";
import { forkInstanceTransaction } from "./_utils/fork/transaction";
import { mergeInstanceTrx } from "./_utils/merge/transaction";
import { getPreAllocatedStudents } from "./_utils/pre-allocated-students";
import { algorithmRouter } from "./algorithm";
import { externalSystemRouter } from "./external";
import { matchingRouter } from "./matching";
import { preferenceRouter } from "./preference";
import { projectRouter } from "./project";

import { pages } from "@/content/pages";
import { newReaderAllocationSchema } from "@/lib/validations/allocate-readers/new-reader-allocation";
import { assignReadersTx } from "./_utils/assign-readers";

// TODO: add stage checks to stage-specific procedures
export const instanceRouter = createTRPCRouter({
  matching: matchingRouter,
  algorithm: algorithmRouter,
  project: projectRouter,
  external: externalSystemRouter,
  preference: preferenceRouter,

  exists: protectedProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        return await ctx.db.allocationInstance.findFirst({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            id: instance,
          },
        });
      },
    ),

  get: protectedProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => getInstance(ctx.db, params)),

  access: roleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const user = ctx.session.user;
      const stage = ctx.instance.stage;

      const adminExists = await checkAdminPermissions(ctx.db, params, user.id);
      if (adminExists) return true;

      if (user.role === Role.SUPERVISOR) {
        return !supervisorStages.includes(stage);
      }

      if (user.role === Role.STUDENT) {
        return !studentStages.includes(stage);
      }

      // TODO: throw error instead of returning
      return true;
    }),

  currentStage: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx }) => ctx.instance.stage),

  setStage: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        stage: z.nativeEnum(Stage),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          stage,
        },
      }) => {
        await ctx.db.allocationInstance.update({
          where: {
            instanceId: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              id: instance,
            },
          },
          data: { stage },
        });
      },
    ),

  selectedAlgorithm: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      if (!ctx.instance.selectedAlgName) {
        return {
          id: "",
          displayName: "",
        };
      }

      const algorithm = await ctx.db.algorithm.findFirstOrThrow({
        where: { ...expand(params), algName: ctx.instance.selectedAlgName },
        select: { algName: true, displayName: true },
      });

      return {
        id: algorithm.algName,
        displayName: algorithm.displayName,
      };
    }),

  projectAllocations: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .output(
      z.object({
        byStudent: z.array(allocationByStudentDtoSchema),
        byProject: z.array(allocationByProjectDtoSchema),
        bySupervisor: z.array(allocationBySupervisorDtoSchema),
      }),
    )
    .query(async ({ ctx, input: { params } }) => {
      const allocationData = await getAllAllocationData(ctx.db, params);

      const byStudent = allocationData
        .map((allocation) => ({
          student: {
            id: allocation.student.user.id,
            name: allocation.student.user.name!,
            email: allocation.student.user.email!,
            ranking: allocation.studentRanking,
          },
          project: {
            id: allocation.project.id,
            title: allocation.project.title,
          },
          supervisor: {
            id: allocation.project.supervisor.user.id,
            name: allocation.project.supervisor.user.name!,
          },
        }))
        .sort((a, b) => a.student.id.localeCompare(b.student.id));

      const byProject = allocationData
        .map((allocation) => ({
          project: {
            id: allocation.project.id,
            title: allocation.project.title,
            capacityLowerBound: allocation.project.capacityLowerBound,
            capacityUpperBound: allocation.project.capacityUpperBound,
          },
          supervisor: {
            id: allocation.project.supervisor.user.id,
            name: allocation.project.supervisor.user.name!,
          },
          student: {
            id: allocation.student.user.id,
            name: allocation.student.user.name,
            ranking: allocation.studentRanking,
          },
        }))
        .sort((a, b) => a.project.id.localeCompare(b.project.id));

      // TODO: sort out duplicate rows (group or remove)
      const bySupervisor = allocationData
        .map((allocation) => ({
          project: {
            id: allocation.project.id,
            title: allocation.project.title,
          },
          supervisor: {
            id: allocation.project.supervisor.user.id,
            name: allocation.project.supervisor.user.name!,
            email: allocation.project.supervisor.user.email!,
            allocationLowerBound:
              allocation.project.supervisor.supervisorInstanceDetails[0]
                .projectAllocationLowerBound,
            allocationTarget:
              allocation.project.supervisor.supervisorInstanceDetails[0]
                .projectAllocationTarget,
            allocationUpperBound:
              allocation.project.supervisor.supervisorInstanceDetails[0]
                .projectAllocationUpperBound,
          },
          student: {
            id: allocation.student.user.id,
            name: allocation.student.user.name,
            ranking: allocation.studentRanking,
          },
        }))
        .sort((a, b) => a.supervisor.id.localeCompare(b.supervisor.id));

      return { byStudent, byProject, bySupervisor };
    }),

  getEditFormDetails: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const data = await ctx.db.allocationInstance.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            id: instance,
          },
          include: { flags: true, tags: true },
        });

        return {
          ...data,
          instanceName: data.displayName,
          minNumPreferences: data.minPreferences,
          maxNumPreferences: data.maxPreferences,
          maxNumPerSupervisor: data.maxPreferencesPerSupervisor,
        };
      },
    ),

  supervisors: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const supervisors = await ctx.db.supervisorInstanceDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            userInInstance: { select: { user: true } },
            projectAllocationTarget: true,
            projectAllocationUpperBound: true,
          },
        });

        return supervisors.map(({ userInInstance, ...s }) => ({
          id: userInInstance.user.id,
          name: userInInstance.user.name,
          email: userInInstance.user.email,
          projectTarget: s.projectAllocationTarget,
          projectUpperQuota: s.projectAllocationUpperBound,
        }));
      },
    ),

  students: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const studentData = await ctx.db.studentDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            userInInstance: {
              select: {
                user: true,
                studentAllocation: {
                  select: { project: { select: { id: true, title: true } } },
                },
              },
            },
            studentLevel: true,
          },
        });

        return studentData.map(({ userInInstance, studentLevel }) => ({
          ...userInInstance.user,
          level: studentLevel,
          projectAllocation:
            userInInstance.studentAllocation?.project ?? undefined,
        }));
      },
    ),

  getSupervisors: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const supervisors = await ctx.db.userInInstance.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            role: Role.SUPERVISOR,
          },
          select: {
            user: true,
            supervisorInstanceDetails: {
              where: {
                allocationGroupId: group,
                allocationSubGroupId: subGroup,
                allocationInstanceId: instance,
              },
            },
          },
        });

        return supervisors.map(({ user, supervisorInstanceDetails }) => ({
          institutionId: user.id,
          fullName: user.name!,
          email: user.email!,
          projectTarget: supervisorInstanceDetails[0].projectAllocationTarget,
          projectUpperQuota:
            supervisorInstanceDetails[0].projectAllocationUpperBound,
        }));
      },
    ),

  addSupervisor: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newSupervisor: newSupervisorSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          newSupervisor: {
            institutionId,
            fullName,
            email,
            projectTarget,
            projectUpperQuota,
          },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const exists = await tx.supervisorInstanceDetails.findFirst({
            where: {
              userId: institutionId,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });
          if (exists) throw new TRPCClientError("User is already a supervisor");

          await validateEmailGUIDMatch(tx, institutionId, email, fullName);

          await tx.userInInstance.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              role: Role.SUPERVISOR,
              userId: institutionId,
            },
          });

          await tx.supervisorInstanceDetails.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: institutionId,
              projectAllocationLowerBound: 0,
              projectAllocationTarget: projectTarget,
              projectAllocationUpperBound: projectUpperQuota,
            },
          });
        });

        return {
          institutionId,
          fullName,
          email,
          projectTarget,
          projectUpperQuota,
        };
      },
    ),

  addSupervisors: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newSupervisors: z.array(newSupervisorSchema),
      }),
    )
    .mutation(async ({ ctx, input: { params, newSupervisors } }) => {
      return await addSupervisorsTx(ctx.db, newSupervisors, params);
    }),

  removeSupervisor: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, supervisorId: z.string() }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorId,
        },
      }) => {
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

  removeSupervisors: instanceAdminProcedure
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

  invitedSupervisors: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const invitedUsers = await ctx.db.userInInstance.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            role: Role.SUPERVISOR,
          },
          select: { user: true, joined: true },
        });

        return {
          supervisors: invitedUsers.map(({ user, joined }) => ({
            id: user.id,
            name: user.name!,
            email: user.email!,
            joined,
          })),
        };
      },
    ),

  getStudents: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const students = await ctx.db.studentDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            userInInstance: { select: { user: true } },
            studentLevel: true,
          },
        });

        return students.map(({ userInInstance: { user }, studentLevel }) => ({
          institutionId: user.id,
          fullName: user.name!,
          email: user.email!,
          level: studentLevelSchema.parse(studentLevel),
        }));
      },
    ),

  addStudent: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newStudent: newStudentSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          newStudent: { institutionId, fullName, email, level },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const exists = await tx.studentDetails.findFirst({
            where: {
              userId: institutionId,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });
          if (exists) throw new TRPCClientError("User is already a student");

          await validateEmailGUIDMatch(tx, institutionId, email, fullName);

          await tx.userInInstance.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              role: Role.STUDENT,
              userId: institutionId,
            },
          });

          await tx.studentDetails.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: institutionId,
              studentLevel: level,
              submittedPreferences: false,
            },
          });
        });
        return { institutionId, fullName, email, level };
      },
    ),

  addStudents: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newStudents: z.array(newStudentSchema),
      }),
    )
    .mutation(async ({ ctx, input: { params, newStudents } }) => {
      return await addStudentsTx(ctx.db, newStudents, params);
    }),

  removeStudent: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentId,
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const project = await tx.project.findFirst({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              preAllocatedStudentId: studentId,
            },
          });

          if (project) {
            await tx.project.update({
              where: { id: project.id },
              data: { preAllocatedStudentId: null },
            });
          }

          await tx.userInInstance.delete({
            where: {
              instanceMembership: {
                allocationGroupId: group,
                allocationSubGroupId: subGroup,
                allocationInstanceId: instance,
                userId: studentId,
              },
            },
          });
        });
      },
    ),

  removeStudents: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentIds: z.array(z.string()),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentIds,
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const projects = await tx.project.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              preAllocatedStudentId: { in: studentIds },
            },
          });

          if (projects.length > 0) {
            await tx.project.updateMany({
              where: { id: { in: projects.map((p) => p.id) } },
              data: { preAllocatedStudentId: null },
            });
          }

          await tx.userInInstance.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: { in: studentIds },
            },
          });
        });
      },
    ),

  invitedStudents: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const invitedStudents = await ctx.db.studentDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            userInInstance: { include: { user: true } },
            studentLevel: true,
          },
        });

        const preAllocatedStudents = await getPreAllocatedStudents(ctx.db, {
          group,
          subGroup,
          instance,
        });

        const all = invitedStudents.map(({ userInInstance, studentLevel }) => ({
          id: userInInstance.user.id,
          name: userInInstance.user.name,
          email: userInInstance.user.email,
          joined: userInInstance.joined,
          level: studentLevel,
          preAllocated: preAllocatedStudents.has(userInInstance.user.id),
        }));

        return {
          all,
          incomplete: all.filter((s) => !s.joined && !s.preAllocated),
          preAllocated: all.filter((s) => s.preAllocated),
        };
      },
    ),

  edit: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        updatedInstance: updatedInstanceSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          updatedInstance: { flags, tags, ...updatedData },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          await tx.allocationInstance.update({
            where: {
              instanceId: {
                allocationGroupId: group,
                allocationSubGroupId: subGroup,
                id: instance,
              },
            },
            data: updatedData,
          });

          const currentInstanceFlags = await tx.flag.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });

          const newInstanceFlags = setDiff(
            flags,
            currentInstanceFlags,
            (a) => a.title,
          );
          const staleInstanceFlags = setDiff(
            currentInstanceFlags,
            flags,
            (a) => a.title,
          );

          await tx.flag.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: { in: staleInstanceFlags.map((f) => f.title) },
            },
          });

          await tx.flag.createMany({
            data: newInstanceFlags.map((f) => ({
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: f.title,
            })),
          });

          const currentInstanceTags = await tx.tag.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });

          const newInstanceTags = setDiff(
            tags,
            currentInstanceTags,
            (a) => a.title,
          );
          const staleInstanceTags = setDiff(
            currentInstanceTags,
            tags,
            (a) => a.title,
          );

          await tx.tag.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: { in: staleInstanceTags.map((t) => t.title) },
            },
          });

          await tx.tag.createMany({
            data: newInstanceTags.map((t) => ({
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: t.title,
            })),
          });
        });
      },
    ),

  getHeaderTabs: protectedProcedure
    .input(z.object({ params: instanceParamsSchema.partial() }))
    .query(async ({ ctx, input }) => {
      const result = instanceParamsSchema.safeParse(input.params);
      if (!result.success) return { headerTabs: [], instancePath: "" };

      const params = result.data;

      const instance = await getInstance(ctx.db, params);
      const role = await getUserRole(ctx.db, params, ctx.session.user.id);
      const instancePath = formatParamsAsPath(params);

      const adminTabs = [pages.allSupervisors, pages.allStudents];

      if (role !== Role.ADMIN) {
        return {
          headerTabs: [pages.instanceHome, pages.allProjects],
          instancePath,
        };
      }

      const headerTabs =
        instance.stage === Stage.SETUP
          ? [pages.instanceHome, ...adminTabs]
          : [pages.instanceHome, pages.allProjects, ...adminTabs];

      return { headerTabs, instancePath };
    }),

  getSidePanelTabs: multiRoleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const user = ctx.session.user;

      const forkedInstanceId = await ctx.db.allocationInstance.findFirst({
        where: {
          allocationGroupId: params.group,
          allocationSubGroupId: params.subGroup,
          parentInstanceId: params.instance,
        },
      });

      const instance = {
        ...ctx.instance,
        forkedInstanceId: forkedInstanceId?.id ?? null,
      };

      const preAllocatedProject = await hasSelfDefinedProject(
        ctx.db,
        params,
        user,
        user.roles,
      );

      const tabs = getTabs({
        roles: user.roles,
        instance,
        preAllocatedProject,
      });
      return tabs;
    }),

  fork: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newInstance: forkedInstanceSchema,
      }),
    )
    .mutation(async ({ ctx, input: { params, newInstance: forked } }) => {
      if (ctx.instance.stage !== Stage.ALLOCATION_PUBLICATION) {
        // TODO: throw error instead of returning
        return;
      }
      await forkInstanceTransaction(ctx.db, forked, params);
    }),

  merge: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .mutation(async ({ ctx, input: { params } }) => {
      await mergeInstanceTrx(ctx.db, params);
    }),

  getFlags: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const flags = await ctx.db.flag.findMany({
        where: {
          allocationGroupId: params.group,
          allocationSubGroupId: params.subGroup,
          allocationInstanceId: params.instance,
        },
        select: { title: true },
      });

      return flags.map(({ title }) => title);
    }),
    
  assignReader: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newReaderAllocation: newReaderAllocationSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          newReaderAllocation: {
            project_title,
            student_guid,
            reader_name,
          },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          
          const reader = await tx.user.findFirst({where: {name: reader_name},});
          if (!reader) { const reader_id = ""; return null };
          const reader_id = reader.id;

          const project = await tx.project.findFirst({where: {title: project_title},});
          if (!project) { const project_id = ""; return null };
          const project_id = project.id;

          await tx.projectAllocationReader.create({
            data: {
              readerId: reader_id,
              projectId: project_id,
              studentId: student_guid,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });
        });

        return {
          student_guid,
        };
      },
    ),

  assignReaders: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newReaderAllocations: z.array(newReaderAllocationSchema),
      }),
    )
    .mutation(async ({ ctx, input: { params, newReaderAllocations } }) => {
      return await assignReadersTx(ctx.db, newReaderAllocations, params);
    }),
});
