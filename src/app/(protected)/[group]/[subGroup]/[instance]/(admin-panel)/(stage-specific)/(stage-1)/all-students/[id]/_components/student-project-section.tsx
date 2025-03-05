import Link from "next/link";

import { SubHeading } from "@/components/heading";
import { buttonVariants } from "@/components/ui/button";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { PageParams } from "@/lib/validations/params";

export async function StudentProjectSection({
  params,
}: {
  params: PageParams;
}) {
  const project = await api.user.student.getAllocatedProject({
    params,
    studentId: params.id,
  });

  if (!project) {
    throw new Error("Pre-allocated project not found");
  }

  return (
    <>
      <SubHeading>Self-Defined Project</SubHeading>
      <div>
        <p>This student has been allocated their self-defined project</p>
        <p className="flex items-center justify-start gap-2">
          View project:
          <Link
            href={`../projects/${project.id}`}
            className={cn(buttonVariants({ variant: "link" }), "text-base")}
          >
            {project.title}
          </Link>
        </p>
      </div>
    </>
  );
}
