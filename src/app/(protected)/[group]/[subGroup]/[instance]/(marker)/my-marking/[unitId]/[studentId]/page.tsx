import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { MarkingSubmissionStatus } from "@/dto/result/marking-submission-status";

import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { type InstanceParams } from "@/lib/validations/params";

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

  const unitOfAssessment = await api.user.marker.getUnitById({
    params,
    unitOfAssessmentId,
  });

  const markingCriteria = await api.user.marker.getCriteria({
    params,
    unitOfAssessmentId,
  });

  const { status, submission } = await api.user.marker.getSubmission({
    params,
    unitOfAssessmentId,
    studentId,
  });

  if (!project) throw new Error("no project defined"); // error goes here

  if (status === MarkingSubmissionStatus.CLOSED) {
    return (
      <PanelWrapper>
        <div className="grid place-items-center py-20">
          <h1 className="text-3xl italic">
            This unit is not yet open for marking
          </h1>
        </div>
      </PanelWrapper>
    );
  }

  if (status === MarkingSubmissionStatus.SUBMITTED) {
    return (
      <PanelWrapper>
        <div className="grid place-items-center py-20">
          <h1 className="text-3xl italic">This unit has been submitted</h1>
        </div>
      </PanelWrapper>
    );
  }

  return (
    <PanelWrapper>
      <Heading
        className={cn(
          "flex items-center justify-between gap-2 text-4xl",
          project.title.length > 30 && "text-3xl",
        )}
      >
        <strong>Marking:</strong>
        {project.title}
      </Heading>

      <SectionHeading>{unitOfAssessment.title}</SectionHeading>

      <div className="mt-6 flex flex-col gap-6">
        <MarkingSection
          markingCriteria={markingCriteria}
          initialState={submission}
        />
      </div>
    </PanelWrapper>
  );
}
