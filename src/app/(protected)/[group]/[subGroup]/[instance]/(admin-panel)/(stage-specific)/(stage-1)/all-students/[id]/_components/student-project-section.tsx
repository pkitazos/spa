import { type ClassValue } from "clsx";
import { FileIcon } from "lucide-react";

import { type ProjectDTO } from "@/dto";

import { SectionHeading } from "@/components/heading";
import { MarkdownRenderer } from "@/components/markdown-editor";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

export async function StudentProjectSection({
  allocatedProject,
  className,
}: {
  allocatedProject: ProjectDTO;
  className?: ClassValue;
}) {
  return (
    <section className={cn("flex flex-col", className)}>
      <SectionHeading icon={FileIcon} className="mb-2">
        Project Description
      </SectionHeading>
      <Separator className="my-6" />
      <div className="flex flex-col items-start gap-6">
        <SectionHeading>{allocatedProject.title}</SectionHeading>
        <MarkdownRenderer source={allocatedProject.description} />
      </div>
    </section>
  );
}
