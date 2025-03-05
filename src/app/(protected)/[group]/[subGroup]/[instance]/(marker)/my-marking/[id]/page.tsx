import { Heading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";

import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { toPP1, toPP3 } from "@/lib/utils/general/instance-params";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: PageParams }) {
  const { displayName } = await api.institution.instance.get({ params });
  const { title } = await api.project.getById({
    params: toPP3(params, params.id),
  });

  return {
    title: metadataTitle([title, PAGES.myMarking.title, displayName, app.name]),
  };
}

export default async function Marks({ params }: { params: PageParams }) {
  const project = await api.project.getById({ params: toPP1(params) });
  // const submissionMarkingData = await api.user.marker.getSubmissionMarkingData({})

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
        {/* <MarkingSection project={project} /> */}
      </div>
    </PageWrapper>
  );
}
