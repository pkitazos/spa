"use client";
import { cn } from "@/lib/utils";
import {
  getCurrentCapacity,
  withinCapacity,
} from "@/lib/utils/allocation-adjustment/supervisor";
import {
  ProjectInfo,
  SupervisorDetails,
} from "@/lib/validations/allocation-adjustment";

export function DebugComponent({
  DEBUG,
  supervisors,
  allProjects,
}: {
  DEBUG: boolean;
  supervisors: SupervisorDetails[];
  allProjects: ProjectInfo[];
}) {
  if (!DEBUG) return <></>;
  return (
    <>
      {supervisors.map((s) => {
        const capacity = getCurrentCapacity(allProjects, s);
        const invalid = !withinCapacity(allProjects, s);
        return (
          <div
            className={cn("mt-5", invalid && "text-destructive")}
            key={s.supervisorId}
          >
            <p className="font-semibold">{s.supervisorId}</p>
            <p>projects: [{s.projects.join(", ")}]</p>
            <p>current capacity: {capacity}</p>
            <p>lowerBound: {s.lowerBound}</p>
            <p>target: {s.target}</p>
            <p>upperBound: {s.upperBound}</p>
          </div>
        );
      })}
    </>
  );
}
