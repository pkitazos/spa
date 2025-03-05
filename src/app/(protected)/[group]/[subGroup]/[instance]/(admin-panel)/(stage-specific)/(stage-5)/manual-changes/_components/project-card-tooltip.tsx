import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { getProjectSupervisor } from "@/lib/utils/allocation-adjustment/supervisor";
import { ProjectInfo } from "@/lib/validations/allocation-adjustment";

import { useAllocDetails } from "./allocation-store";

export function ProjectCardTooltip({
  projectInfo,
}: {
  projectInfo: ProjectInfo;
}) {
  const allSupervisors = useAllocDetails((s) => s.supervisors);
  const { supervisorId } = getProjectSupervisor(projectInfo, allSupervisors);

  const {
    capacityLowerBound: projectLowerBound,
    capacityUpperBound: projectUpperBound,
    projectAllocationLowerBound: supervisorLowerBound,
    projectAllocationTarget: supervisorTarget,
    projectAllocationUpperBound: supervisorUpperBound,
  } = projectInfo;

  return (
    <Card className="max-w-96 border-none shadow-none">
      <CardHeader>
        <p className="-mb-1 text-muted-foreground">Title</p>
        <p className="text-lg font-semibold">{projectInfo.title}</p>
      </CardHeader>
      <CardContent className="-mt-1 flex flex-col gap-5">
        <div>
          <p className="text-muted-foreground">Project ID</p>
          <p className="font-semibold">{projectInfo.id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Supervisor ID</p>
          <p className="font-semibold">{supervisorId}</p>
        </div>
        <Accordion type="single" collapsible>
          <AccordionItem className="border-none" value="item-1">
            <AccordionTrigger className="text-muted-foreground">
              view All
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5">
              <div className="grid grid-cols-2">
                <p className="col-span-2 mb-1 font-semibold">
                  Project Capacities
                </p>
                <p className="col-span-1">Lower bound:</p>
                <p className="col-span-1 text-center">{projectLowerBound}</p>
                <p className="col-span-1">Upper bound:</p>
                <p className="col-span-1 text-center">{projectUpperBound}</p>
              </div>
              <div className="grid grid-cols-2">
                <p className="col-span-2 mb-1 font-semibold">
                  Supervisor Capacities
                </p>
                <p className="col-span-1">Lower Bound:</p>
                <p className="col-span-1 text-center">{supervisorLowerBound}</p>
                <p className="col-span-1">Target:</p>
                <p className="col-span-1 text-center">{supervisorTarget}</p>
                <p className="col-span-1">Upper Bound:</p>
                <p className="col-span-1 text-center">{supervisorUpperBound}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
