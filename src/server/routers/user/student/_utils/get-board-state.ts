import { ProjectPreferenceCardDto } from "@/lib/validations/board";
import { InstanceParams } from "@/lib/validations/params";

import { DB, PreferenceType } from "@/db/types";

export async function getBoardState(
  db: DB,
  params: InstanceParams,
  studentId: string,
) {
  const res = await db.studentDraftPreference.findMany({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
      userId: studentId,
    },
    select: {
      project: {
        select: {
          details: { select: { id: true, title: true } },
          supervisor: {
            select: { userInInstance: { select: { user: true } } },
          },
        },
      },
      score: true,
      type: true,
    },
    orderBy: { score: "asc" },
  });

  const allProjects = res.map((e) => ({
    id: e.project.details.id,
    title: e.project.details.title,
    columnId: e.type,
    rank: e.score,
    supervisor: e.project.supervisor.userInInstance.user,
  }));

  const boardState: Record<PreferenceType, ProjectPreferenceCardDto[]> = {
    [PreferenceType.PREFERENCE]: allProjects.filter(
      (e) => e.columnId === PreferenceType.PREFERENCE,
    ),

    [PreferenceType.SHORTLIST]: allProjects.filter(
      (e) => e.columnId === PreferenceType.SHORTLIST,
    ),
  };

  return boardState;
}
