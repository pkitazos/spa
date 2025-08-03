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
      <SectionHeading className="mb-2 flex items-center">
        <FileIcon className="mr-2 h-6 w-6 text-indigo-500" />
        <span>Project Description</span>
      </SectionHeading>
      <Separator className="my-6" />
      <div className="flex flex-col items-start gap-6">
        <SectionHeading>{allocatedProject.title}</SectionHeading>
        <MarkdownRenderer source={allocatedProject.description} />
      </div>
    </section>
  );
}
