import { z } from "zod";

import { Grade } from "@/config/grades";
import { PAGES } from "@/config/pages";

import {
  flagDtoSchema,
  instanceDtoSchema,
  ProjectAllocationStatus,
  projectDtoSchema,
  projectStatusRank as statusRank,
  type ReaderDTO,
  readerDtoSchema,
  studentDtoSchema,
  type SupervisorDTO,
  supervisorDtoSchema,
  tagDtoSchema,
  unitOfAssessmentDtoSchema,
} from "@/dto";
import {
  LinkUserResult,
  LinkUserResultSchema,
} from "@/dto/result/link-user-result";
import {
  ReaderAssignmentResult,
  readerAssignmentResultSchema,
} from "@/dto/result/reader-allocation-result";

import { AllocationInstance } from "@/data-objects";

import { Transformers as T } from "@/db/transformers";
import { AllocationMethod, Role, Stage } from "@/db/types";
import { stageSchema } from "@/db/types";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { expand } from "@/lib/utils/general/instance-params";
import { newReaderAllocationSchema } from "@/lib/validations/allocate-readers/new-reader-allocation";
import { instanceParamsSchema } from "@/lib/validations/params";
import { tabGroupSchema } from "@/lib/validations/tabs";

import { algorithmRouter } from "./algorithm";
import { matchingRouter } from "./matching";
import { preferenceRouter } from "./preference";

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

  getUsedProjectDescriptors: procedure.instance.user
    .output(
      z.object({ flags: z.array(flagDtoSchema), tags: z.array(tagDtoSchema) }),
    )
    .query(async ({ ctx: { instance } }) => ({
      flags: await instance.getFlagsOnProjects(),
      tags: await instance.getTagsOnProjects(),
    })),

  getAllProjectDescriptors: procedure.instance.user
    .output(
      z.object({ flags: z.array(flagDtoSchema), tags: z.array(tagDtoSchema) }),
    )
    .query(async ({ ctx: { instance } }) => ({
      tags: await instance.getTags(),
      flags: await instance.getFlags(),
    })),

  supervisors: procedure.instance.user
    .output(z.array(supervisorDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getSupervisors()),

  getSupervisors: procedure.instance.subGroupAdmin
    .output(z.array(supervisorDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getSupervisors()),

  addSupervisor: procedure.instance.subGroupAdmin
    .input(z.object({ newSupervisor: supervisorDtoSchema }))
    .output(LinkUserResultSchema)
    .mutation(
      async ({ ctx: { instance, institution }, input: { newSupervisor } }) => {
        if (await instance.isSupervisor(newSupervisor.id)) {
          return LinkUserResult.PRE_EXISTING;
        }

        const userExists = await institution.userExists(newSupervisor.id);

        if (!userExists) await institution.createUser(newSupervisor);

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

        await institution.createUsers(
          newSupervisors.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
          })),
        );

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
      const invitedUsers = await instance.getSupervisors();

      return {
        supervisors: invitedUsers.map((u) => ({
          id: u.id,
          name: u.name,
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
          student: studentDtoSchema,
          allocation: projectDtoSchema.optional(),
        }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getStudentAllocationDetails(),
    ),

  // BREAKING output type changed
  getStudents: procedure.instance.subGroupAdmin
    .output(z.array(studentDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getStudents()),

  // BREAKING input/output types changed
  addStudent: procedure.instance.subGroupAdmin
    .input(z.object({ newStudent: studentDtoSchema }))
    .output(LinkUserResultSchema)
    .mutation(
      async ({ ctx: { instance, institution }, input: { newStudent } }) => {
        if (await instance.isStudent(newStudent.id)) {
          return LinkUserResult.PRE_EXISTING;
        }

        const userExists = await institution.userExists(newStudent.id);

        if (!userExists) await institution.createUser(newStudent);

        await instance.linkUser(newStudent);
        await instance.linkStudents([newStudent]);

        if (!userExists) return LinkUserResult.CREATED_NEW;
        else return LinkUserResult.OK;
      },
    ),

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

        await institution.createUsers(
          newStudents.map((s) => ({ id: s.id, name: s.name, email: s.email })),
        );

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
    .output(
      z.object({
        all: z.array(
          z.object({ student: studentDtoSchema, preAllocated: z.boolean() }),
        ),
        incomplete: z.array(
          z.object({ student: studentDtoSchema, preAllocated: z.boolean() }),
        ),
        preAllocated: z.array(
          z.object({ student: studentDtoSchema, preAllocated: z.boolean() }),
        ),
      }),
    )
    .query(async ({ ctx: { instance } }) => {
      const invitedStudents = await instance.getStudents();

      const preAllocations = await instance.getPreAllocations();
      const preAllocatedStudents = new Set(
        preAllocations.map((p) => p.project.id),
      );

      const all = invitedStudents.map((u) => ({
        student: u,
        preAllocated: preAllocatedStudents.has(u.id),
      }));

      return {
        all,
        incomplete: all.filter((s) => !s.student.joined && !s.preAllocated),
        preAllocated: all.filter((s) => s.preAllocated),
      };
    }),

  updateStudentFlag: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string(), flagId: z.string() }))
    .output(studentDtoSchema)
    .mutation(async ({ ctx: { instance }, input: { studentId, flagId } }) => {
      const student = await instance.getStudent(studentId);
      return student.setStudentFlag(flagId);
    }),

  edit: procedure.instance.subGroupAdmin
    .input(
      z.object({
        updatedInstance: instanceDtoSchema.omit({
          stage: true,
          supervisorAllocationAccess: true,
          studentAllocationAccess: true,
        }),
        flags: z.array(flagDtoSchema),
        tags: z.array(tagDtoSchema.omit({ id: true })),
      }),
    )
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { updatedInstance, flags, tags } }) =>
        await instance.edit({ flags, tags, instance: updatedInstance }),
    ),

  getHeaderTabs: procedure.user
    .input(z.object({ params: instanceParamsSchema.partial() }))
    .query(async ({ ctx, input }) => {
      const result = instanceParamsSchema.safeParse(input.params);

      // TODO consider moving this control flow to client
      if (!result.success) return { headerTabs: [], instancePath: "" };

      const instance = new AllocationInstance(ctx.db, result.data);

      const instanceData = await instance.get();

      const roles = await ctx.user.getRolesInInstance(instance.params);

      const instancePath = formatParamsAsPath(instance.params);

      if (!roles.has(Role.ADMIN)) {
        return {
          headerTabs: [PAGES.instanceHome, PAGES.allProjects],
          instancePath,
        };
      }

      const headerTabs =
        instanceData.stage === Stage.SETUP
          ? [PAGES.instanceHome]
          : [PAGES.instanceHome, PAGES.allProjects];

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
          title: "General",
          tabs: [
            PAGES.stageControl,
            PAGES.settings,
            PAGES.allSupervisors,
            PAGES.allStudents,
            PAGES.allProjects,
          ],
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
          tabGroups.push({ title: "General", tabs: [PAGES.allProjects] });
          supervisorTabs.unshift(PAGES.instanceTasks);
        } else if (stage !== Stage.SETUP) {
          supervisorTabs.unshift(PAGES.nonAdminSupervisorTasks);
        }

        tabGroups.push({ title: "Supervisor", tabs: supervisorTabs });
      }

      if (roles.has(Role.STUDENT)) {
        const isSecondRole = roles.size > 1;
        const studentTabs = await instance.getStudentTabs(!preAllocatedProject);

        tabGroups.push({ title: "General", tabs: [PAGES.allProjects] });
        tabGroups.push({
          title: "Student",
          tabs: isSecondRole
            ? studentTabs
            : [PAGES.instanceTasks, ...studentTabs],
        });
      }

      return tabGroups;
    }),

  getAllocatedStudents: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({ student: studentDtoSchema, project: projectDtoSchema }),
      ),
    )
    .query(async ({ ctx: { instance } }) => {
      const randomlyAllocatedStudents =
        await instance.getAllocatedStudentsByMethods([AllocationMethod.RANDOM]);

      const manuallyAllocatedStudents =
        await instance.getAllocatedStudentsByMethods([AllocationMethod.MANUAL]);

      const algorithmicallyAllocatedStudents =
        await instance.getAllocatedStudentsByMethods([
          AllocationMethod.ALGORITHMIC,
        ]);

      const preAllocatedStudents = await instance.getAllocatedStudentsByMethods(
        [AllocationMethod.PRE_ALLOCATED],
      );

      return [
        ...randomlyAllocatedStudents,
        ...manuallyAllocatedStudents,
        ...algorithmicallyAllocatedStudents,
        ...preAllocatedStudents,
      ];
    }),

  getRandomlyAllocatedStudents: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({ student: studentDtoSchema, project: projectDtoSchema }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getAllocatedStudentsByMethods([AllocationMethod.RANDOM]),
    ),

  getManuallyAllocatedStudents: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({ student: studentDtoSchema, project: projectDtoSchema }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getAllocatedStudentsByMethods([AllocationMethod.MANUAL]),
    ),

  getAlgorithmAllocatedStudents: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({ student: studentDtoSchema, project: projectDtoSchema }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getAllocatedStudentsByMethods([
          AllocationMethod.ALGORITHMIC,
        ]),
    ),

  getPreAllocatedStudents: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({ student: studentDtoSchema, project: projectDtoSchema }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getAllocatedStudentsByMethods([
          AllocationMethod.PRE_ALLOCATED,
        ]),
    ),

  getUnallocatedStudents: procedure.instance.subGroupAdmin
    .output(z.array(studentDtoSchema))
    .query(async ({ ctx: { instance } }) => {
      const unmatchedStudents = await instance.getUnallocatedStudents();
      return unmatchedStudents;
    }),

  // todo: fix this
  getProjectsWithAllocationStatus: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          project: projectDtoSchema,
          supervisor: supervisorDtoSchema,
          status: z.enum(ProjectAllocationStatus),
          studentId: z.string().optional(),
        }),
      ),
    )
    .query(async ({ ctx: { instance } }) => {
      const allProjects = await instance.getProjectDetails();

      const allAllocations = await instance.getProjectAllocations();

      const allAllocationsMap = allAllocations.reduce(
        (acc, a) => ({ ...acc, [a.project.id]: a.method }),
        {} as Record<string, AllocationMethod>,
      );

      return allProjects
        .map(({ project, supervisor, allocatedStudent }) => {
          if (!allAllocationsMap[project.id] || !allocatedStudent) {
            return {
              project,
              supervisor: supervisor,
              status: ProjectAllocationStatus.UNALLOCATED,
              studentId: undefined,
            };
          }

          return {
            project,
            supervisor: supervisor,
            status: allAllocationsMap[project.id],
            studentId: allocatedStudent.id,
          };
        })
        .sort((a, b) => a.project.title.localeCompare(b.project.title))
        .sort((a, b) => statusRank[a.status] - statusRank[b.status]);
    }),

  getSupervisorsWithAllocations: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          supervisor: supervisorDtoSchema,
          allocations: z.array(
            z.object({ project: projectDtoSchema, student: studentDtoSchema }),
          ),
        }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getSupervisorAllocationDetails(),
    ),

  saveManualStudentAllocations: procedure.instance.subGroupAdmin
    .input(
      z.object({
        allocations: z.array(
          z.object({
            studentId: z.string(),
            projectId: z.string(),
            supervisorId: z.string(),
          }),
        ),
      }),
    )
    .output(z.array(z.object({ studentId: z.string(), success: z.boolean() })))
    .mutation(async ({ ctx: { instance }, input: { allocations } }) => {
      const results = [];

      for (const allocation of allocations) {
        const { studentId, projectId, supervisorId } = allocation;

        // todo: this whole thing should be in a transaction
        try {
          await instance.deleteStudentAllocation(studentId);

          const conflictStudent =
            await instance.getProjectAllocation(projectId);

          if (conflictStudent) {
            await instance.deleteStudentAllocation(conflictStudent.id);
          }

          const project = instance.getProject(projectId);
          await project.clearPreAllocation();

          const projectData = await project.get();
          if (projectData.supervisorId !== supervisorId) {
            await project.transferSupervisor(supervisorId);
          }

          const student = await instance.getStudent(studentId);
          const studentData = await student.get();
          await project.addFlags([studentData.flag]);

          await instance.createManualAllocation(studentId, projectId);

          results.push({ studentId, success: true });
        } catch (_err) {
          results.push({ studentId, success: false });
        }
      }

      return results;
    }),

  getFlags: procedure.instance.user
    .output(z.array(flagDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getFlags()),

  getMarkerSubmissions: procedure.instance.subGroupAdmin
    .input(z.object({ unitOfAssessmentId: z.string() }))
    .output(
      z.array(
        z.object({
          project: projectDtoSchema,
          student: studentDtoSchema,
          supervisor: supervisorDtoSchema,
          supervisorGrade: z.string().optional(),
          reader: readerDtoSchema,
          readerGrade: z.string().optional(),
        }),
      ),
    )
    .query(async ({ ctx: { instance, db }, input: { unitOfAssessmentId } }) => {
      const supervisors = await instance.getSupervisors();

      const supervisorMap = supervisors.reduce(
        (acc, supervisor) => ({ ...acc, [supervisor.id]: supervisor }),
        {} as Record<string, SupervisorDTO>,
      );

      const readers = await instance.getReaders();

      const readerMap = readers.reduce(
        (acc, reader) => ({ ...acc, [reader.id]: reader }),
        {} as Record<string, ReaderDTO>,
      );

      const submission = await db.unitOfAssessment.findFirstOrThrow({
        where: { id: unitOfAssessmentId },
        include: { assessmentCriteria: { include: { scores: true } } },
      });

      const studentAllocations = await db.studentProjectAllocation.findMany({
        where: expand(instance.params),
        include: {
          student: {
            include: {
              studentFlag: true,
              userInInstance: { include: { user: true } },
            },
          },
          project: {
            include: {
              readerAllocations: { include: { reader: true } },
              flagsOnProject: { include: { flag: true } },
              tagsOnProject: { include: { tag: true } },
            },
          },
        },
      });

      return (
        studentAllocations
          // WARNING: remove filter before deploying to prod
          .filter((a) => {
            const has_reader = a.project.readerAllocations.length > 0;
            if (!has_reader) {
              console.log("no reader: ", a.project.title);
            }
            return has_reader;
          })

          .map((a) => {
            const ra = a.project.readerAllocations.find((r) => !r.thirdMarker);
            if (!ra) {
              throw new Error(
                "instance.getMarkerSubmissions: Reader allocation not found",
              );
            }

            const reader = readerMap[ra.readerId];

            if (!reader) {
              throw new Error(
                "instance.getMarkerSubmissions: Reader not found",
              );
            }

            const supervisor = supervisorMap[a.project.supervisorId];

            if (!supervisor) {
              throw new Error(
                "instance.getMarkerSubmissions: Supervisor not found",
              );
            }

            const supervisorScores = submission.assessmentCriteria.map((c) => {
              const supervisorScore = c.scores.find(
                (s) => s.markerId === supervisor.id,
              );
              if (!supervisorScore) return undefined;
              return { weight: c.weight, score: supervisorScore.grade };
            });

            let supervisorGrade: string | undefined;
            if (supervisorScores.every((s) => s !== undefined)) {
              supervisorGrade = Grade.toLetter(
                Grade.computeFromScores(supervisorScores),
              );
            }

            const readerScores = submission.assessmentCriteria.map((c) => {
              const readerScore = c.scores.find(
                (s) => s.markerId === reader.id,
              );
              if (!readerScore) return undefined;
              return { weight: c.weight, score: readerScore.grade };
            });

            let readerGrade: string | undefined;
            if (readerScores.every((s) => s !== undefined)) {
              readerGrade = Grade.toLetter(
                Grade.computeFromScores(readerScores),
              );
            }

            return {
              project: T.toProjectDTO(a.project),
              student: T.toStudentDTO(a.student),
              supervisor,
              supervisorGrade,
              reader,
              readerGrade,
            };
          })
      );
    }),

  assignReaders: procedure.instance
    .inStage([Stage.READER_BIDDING, Stage.READER_ALLOCATION])
    .subGroupAdmin.input(
      z.object({ newReaderAllocations: z.array(newReaderAllocationSchema) }),
    )
    .output(z.array(readerAssignmentResultSchema))
    .mutation(
      async ({ ctx: { db, instance }, input: { newReaderAllocations } }) => {
        const projectAllocationData =
          await instance.getStudentAllocationDetails();
        const studentIds = projectAllocationData.map((a) => a.student.id);

        const readers = await instance.getReaders();
        const readerIds = readers.map(({ id }) => id);

        const allocationData = newReaderAllocations.map((data) => {
          let status: ReaderAssignmentResult = ReaderAssignmentResult.OK;

          if (!studentIds.includes(data.studentId))
            status = ReaderAssignmentResult.MISSING_STUDENT;

          if (!readerIds.includes(data.reader.id))
            status = ReaderAssignmentResult.MISSING_READER;

          return { data, status };
        });

        const studentProjectMap = projectAllocationData.reduce(
          // TODO: fix
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          (acc, val) => ({ ...acc, [val.student.id]: val.allocation?.id! }),
          {} as Record<string, string>,
        );

        await db.readerProjectAllocation.createMany({
          data: allocationData
            .filter((e) => e.status === ReaderAssignmentResult.OK)
            .map(({ data: { reader, studentId } }) => ({
              ...expand(instance.params),
              readerId: reader.id,
              studentId,
              projectId: studentProjectMap[studentId],
              thirdMarker: false, // TODO needs to come from somewhere
            })),
        });

        return allocationData.map((e) => e.status);
      },
    ),

  getAllUnitsOfAssessment: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .subGroupAdmin.output(
      z.array(
        z.object({
          flag: flagDtoSchema,
          units: z.array(unitOfAssessmentDtoSchema),
        }),
      ),
    )
    .query(async ({ ctx: { instance, db } }) => {
      const flags = await db.flag.findMany({
        where: expand(instance.params),
        include: {
          unitsOfAssessment: {
            include: { flag: true, assessmentCriteria: true },
            orderBy: [{ markerSubmissionDeadline: "asc" }],
          },
        },
        orderBy: [{ displayName: "asc" }],
      });

      return flags.map((f) => ({
        flag: T.toFlagDTO(f),
        units: f.unitsOfAssessment.map((x) => T.toUnitOfAssessmentDTO(x)),
      }));
    }),

  setUnitOfAssessmentAccess: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .subGroupAdmin.input(
      z.object({ unitOfAssessmentId: z.string(), open: z.boolean() }),
    )
    .output(z.string())
    .mutation(
      async ({ ctx: { db }, input: { unitOfAssessmentId, open } }) =>
        await db.unitOfAssessment
          .update({ where: { id: unitOfAssessmentId }, data: { open } })
          .then((u) => u.title),
    ),
});
