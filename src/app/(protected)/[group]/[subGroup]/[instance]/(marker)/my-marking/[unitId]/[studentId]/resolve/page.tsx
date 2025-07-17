import { Heading, SubHeading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { type InstanceParams } from "@/lib/validations/params";

import { ResolutionForm } from "./_components/resolution-form";

type PageParams = InstanceParams & { unitId: string; studentId: string };

// export async function generateMetadata({
//   params: { unitId: _unitOfAssessmentId, studentId, ...params },
// }: {
//   params: PageParams;
// }) {
//   const { displayName } = await api.institution.instance.get({ params });
//   const project = await api.user.student.getAllocatedProject({
//     params,
//     studentId,
//   });

//   if (!project) throw new Error("unreachable"); // error goes here

//   return {
//     title: metadataTitle([
//       project.title,
//       PAGES.myMarking.title,
//       displayName,
//       app.name,
//     ]),
//   };
// }

export default async function ResolvePage({
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

  if (!project) return <div>unknown student</div>;

  const user = await auth();
  if (project.supervisor.id !== user.id) {
    return <div>Only the project supervisor can resolve marks</div>;
  }

  return (
    <PageWrapper>
      <Heading
        className={cn(
          "flex items-center justify-between gap-2 text-4xl",
          project.title.length > 30 && "text-3xl",
        )}
      >
        <strong>Resolving:</strong>
        {project.title}
      </Heading>

      <SubHeading>{unitOfAssessment.title}</SubHeading>

      <div className="mt-6 flex flex-col gap-6">
        <ResolutionForm
          studentId={studentId}
          unitOfAssessmentId={unitOfAssessmentId}
        />
      </div>
    </PageWrapper>
  );
}
