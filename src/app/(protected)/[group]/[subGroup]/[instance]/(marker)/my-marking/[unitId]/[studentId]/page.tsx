import { Heading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";

import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { MarkingSection } from "./_components/marking-section";

type PageParams = InstanceParams & { unitId: string; studentId: string };

export async function generateMetadata({
  params: { unitId: _unitOfAssessmentId, studentId, ...params },
}: {
  params: PageParams;
}) {
  const { displayName } = await api.institution.instance.get({ params });
  const project = await api.user.student.getAllocatedProject({
    params,
    studentId,
  });

  if (!project) throw new Error("unreachable"); // error goes here

  return {
    title: metadataTitle([
      project.title,
      PAGES.myMarking.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function MarksPage({
  params: { unitId: unitOfAssessmentId, studentId, ...params },
}: {
  params: PageParams;
}) {
  const project = await api.user.student.getAllocatedProject({
    params,
    studentId,
  });

  const markingCriteria = await api.user.marker.getCriteria({
    params,
    unitOfAssessmentId,
  });

  const markingData = await api.user.marker.getMarks({
    params,
    unitOfAssessmentId,
    studentId,
  });

  console.log(markingData);

  if (!project) throw new Error("no project defined"); // error goes here

  return (
    <PageWrapper>
      <Heading
        className={cn(
          "flex items-center justify-between gap-2 text-4xl",
          project.title.length > 30 && "text-3xl",
        )}
      >
        <strong>Marking:</strong>
        {project.title}
      </Heading>

      <div className="mt-6 flex flex-col gap-6">
        <MarkingSection
          markingCriteria={markingCriteria}
          initialState={markingData}
        />
      </div>
    </PageWrapper>
  );
}
