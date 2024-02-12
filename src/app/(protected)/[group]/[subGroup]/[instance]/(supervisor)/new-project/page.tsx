import { Stage } from "@prisma/client";

import { Heading } from "@/components/heading";
import { api } from "@/lib/trpc/server";
import { instanceParams } from "@/lib/validations/params";
import { CreateProjectForm } from "./_components/create-project-form";

export default async function Page({ params }: { params: instanceParams }) {
  const stage = await api.institution.instance.currentStage.query({ params });

  if (stage !== Stage.PROJECT_SUBMISSION) return;

  return (
    <div className="w-full max-w-5xl">
      <Heading title="New Project" />
      <div className="mx-10">
        <CreateProjectForm />
      </div>
    </div>
  );
}
