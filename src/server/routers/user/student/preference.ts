import { z } from "zod";

import { stageGte, stageIn } from "@/lib/utils/permissions/stage-check";
import { projectPreferenceCardDtoSchema } from "@/lib/validations/board";
import { studentPreferenceSchema } from "@/lib/validations/student-preference";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { AllocationInstance } from "@/data-objects/spaces/instance";
import { User } from "@/data-objects/users/user";
import { Role, SystemRole } from "@/db/types";
import { PreferenceType, Stage } from "@/db/types";
import { userDtoSchema } from "@/dto";

export const preferenceRouter = createTRPCRouter({
  /**
   * Get all draft preferences of a student
   */
  // TODO: change output type
  getAll: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(
      z.array(
        z.object({
          project: z.object({ id: z.string(), title: z.string() }),
          supervisor: userDtoSchema,
          type: z.nativeEnum(PreferenceType),
          rank: z.number(),
        }),
      ),
    )
    .query(async ({ ctx: { instance }, input: { studentId } }) => {
      const student = await instance.getStudent(studentId);
      const draftPreferences = await student.getAllDraftPreferences();

      return draftPreferences.map(({ project, type, supervisor }, i) => ({
        project: { id: project.id, title: project.title },
        supervisor,
        type: type,
        rank: type === PreferenceType.PREFERENCE ? i + 1 : NaN,
      }));
    }),

  /**
   * Get all saved preferences of a student
   */
  // TODO: change output type
  getAllSaved: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          supervisor: userDtoSchema,
          rank: z.number(),
        }),
      ),
    )
    .query(async ({ ctx: { instance }, input: { studentId } }) => {
      const student = await instance.getStudent(studentId);
      const submittedPreferences = await student.getSubmittedPreferences();

      return submittedPreferences.map(({ project, rank, supervisor }) => ({
        id: project.id,
        title: project.title,
        supervisor,
        rank,
      }));
    }),

  // TODO: handle error client-side
  getByProject: procedure.instance.student
    .output(z.record(z.string(), z.nativeEnum(PreferenceType)))
    .query(async ({ ctx: { user } }) => {
      const draftPreferences = await user.getAllDraftPreferences();

      return draftPreferences.reduce(
        (acc, { project, type }) => ({ ...acc, [project.id]: type }),
        {} as Record<string, PreferenceType>,
      );
    }),

  makeUpdate: procedure.instance.user
    .input(
      z.object({
        studentId: z.string(),
        projectId: z.string(),
        preferenceType: studentPreferenceSchema,
      }),
    )
    .output(
      z.record(
        z.nativeEnum(PreferenceType),
        z.array(projectPreferenceCardDtoSchema),
      ),
    )
    .mutation(
      async ({
        ctx: { user, instance },
        input: { studentId, projectId, preferenceType },
      }) => {
        const { ok, message } = await accessControl({
          user,
          instance,
          allowedRoles: [Role.ADMIN, Role.STUDENT],
          stageCheck: (s) => s === Stage.PROJECT_SELECTION,
        });
        if (!ok) throw new Error(message);

        const student = await instance.getStudent(studentId);

        if (await student.hasSelfDefinedProject()) {
          throw new Error("Student has self-defined a project");
        }

        const newPreferenceType = convertPreferenceType(preferenceType);
        await student.updateDraftPreferenceType(projectId, newPreferenceType);

        return await student.getPreferenceBoardState();
      },
    ),

  update: procedure.instance.student
    .input(
      z.object({
        projectId: z.string(),
        preferenceType: studentPreferenceSchema,
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { instance, user },
        input: { projectId, preferenceType },
      }) => {
        const { stage } = await instance.get();
        if (stage !== Stage.PROJECT_SELECTION) return;

        if (await user.hasSelfDefinedProject()) return;

        const newPreferenceType = convertPreferenceType(preferenceType);
        await user.updateDraftPreferenceType(projectId, newPreferenceType);
      },
    ),

  updateSelected: procedure.instance.student
    .input(
      z.object({
        projectIds: z.array(z.string()),
        preferenceType: studentPreferenceSchema,
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { instance, user },
        input: { projectIds, preferenceType },
      }) => {
        const { stage } = await instance.get();
        if (stage !== Stage.PROJECT_SELECTION) return;

        if (await user.hasSelfDefinedProject()) return;

        const newPreferenceType = convertPreferenceType(preferenceType);
        await user.updateManyDraftPreferenceTypes(
          projectIds,
          newPreferenceType,
        );
      },
    ),

  makeReorder: procedure.instance.user
    .input(
      z.object({
        studentId: z.string(),
        projectId: z.string(),
        preferenceType: z.nativeEnum(PreferenceType),
        updatedRank: z.number(),
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { instance, user },
        input: { studentId, projectId, preferenceType, updatedRank },
      }) => {
        const { ok, message } = await accessControl({
          instance,
          user,
          allowedRoles: [Role.ADMIN, Role.STUDENT],
          stageCheck: (s) => s === Stage.PROJECT_SELECTION,
        });
        if (!ok) throw new Error(message);

        const student = await instance.getStudent(studentId);
        if (await student.hasSelfDefinedProject()) return;

        await student.updateDraftPreferenceRank(
          projectId,
          updatedRank,
          preferenceType,
        );
      },
    ),

  reorder: procedure.instance.student
    .input(
      z.object({
        projectId: z.string(),
        preferenceType: z.nativeEnum(PreferenceType),
        updatedRank: z.number(),
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { instance, user },
        input: { projectId, preferenceType, updatedRank },
      }) => {
        const { stage } = await instance.get();
        if (stageGte(stage, Stage.PROJECT_ALLOCATION)) return;

        if (await user.hasSelfDefinedProject()) return;

        await user.updateDraftPreferenceRank(
          projectId,
          updatedRank,
          preferenceType,
        );
      },
    ),

  getForProject: procedure.instance.student
    .input(z.object({ projectId: z.string() }))
    .output(z.nativeEnum(PreferenceType).or(z.literal("None")))
    .query(
      async ({ ctx: { user }, input: { projectId } }) =>
        (await user.getDraftPreference(projectId)) ?? "None",
    ),

  /**
   * TODO: check all references
   */
  submit: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(z.date().optional())
    .mutation(async ({ ctx: { instance, user }, input: { studentId } }) => {
      const { ok, message } = await accessControl({
        instance,
        user,
        allowedRoles: [Role.ADMIN, Role.STUDENT],
        stageCheck: (s) => s === Stage.PROJECT_SELECTION,
      });
      if (!ok) throw new Error(message);

      const student = await instance.getStudent(studentId);

      if (await student.hasSelfDefinedProject()) return;

      return await student.submitPreferences();
    }),

  initialBoardState: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(
      z.object({
        initialProjects: z.record(
          z.nativeEnum(PreferenceType),
          z.array(projectPreferenceCardDtoSchema),
        ),
      }),
    )
    .query(async ({ ctx: { instance, user }, input: { studentId } }) => {
      const { ok, message } = await accessControl({
        instance,
        user,
        allowedRoles: [Role.ADMIN, Role.STUDENT],
        stageCheck: (s) =>
          stageIn(s, [Stage.PROJECT_SELECTION, Stage.ALLOCATION_ADJUSTMENT]),
      });
      if (!ok) throw new Error(message);

      const student = await instance.getStudent(studentId);

      return { initialProjects: await student.getPreferenceBoardState() };
    }),

  change: procedure.instance.subgroupAdmin
    .input(
      z.object({
        studentId: z.string(),
        projectId: z.string(),
        newPreferenceType: studentPreferenceSchema,
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { instance },
        input: { studentId, projectId, newPreferenceType },
      }) => {
        const student = await instance.getStudent(studentId);
        const preferenceType = convertPreferenceType(newPreferenceType);
        await student.updateDraftPreferenceType(projectId, preferenceType);
      },
    ),

  changeSelected: procedure.instance.subgroupAdmin
    .input(
      z.object({
        studentId: z.string(),
        newPreferenceType: z.nativeEnum(PreferenceType).or(z.literal("None")),
        projectIds: z.array(z.string()),
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { instance },
        input: { studentId, newPreferenceType, projectIds },
      }) => {
        const student = await instance.getStudent(studentId);
        const preferenceType = convertPreferenceType(newPreferenceType);
        await student.updateManyDraftPreferenceTypes(
          projectIds,
          preferenceType,
        );
      },
    ),
});

// TODO I like this but it should move...
async function accessControl({
  user,
  instance,
  allowedRoles,
  stageCheck,
}: {
  user: User;
  instance: AllocationInstance;
  allowedRoles: SystemRole[keyof SystemRole][];
  stageCheck: (s: Stage) => boolean;
}) {
  const userRoles = await user.getRolesInInstance(instance.params);
  const roleOk = userRoles.isSubsetOf(new Set(allowedRoles));

  if (!roleOk) {
    return {
      ok: false,
      message: `User ${user.id} does not have permission to access this resource, as ${Array.from(userRoles)} does not sufficiently overlap with ${allowedRoles}.`,
    };
  }

  const stageOk = await instance.get().then(({ stage }) => stageCheck(stage));
  if (!stageOk) {
    return {
      ok: false,
      message: `User ${user.id} cannot access this resource at this stage.`,
    };
  }

  return { ok: true, message: "User can access this resource." };
}

function convertPreferenceType(preferenceType: PreferenceType | "None") {
  return preferenceType === "None" ? undefined : preferenceType;
}
