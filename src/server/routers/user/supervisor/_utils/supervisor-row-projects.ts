// MOVE
// TODO: Refactor this file to use the new DTOs
import { z } from "zod";

import { type ProjectDTO, projectDtoSchema, userDtoSchema } from "@/dto";

type ProjectCapacities = {
  capacityLowerBound: number;
  capacityUpperBound: number;
};

type BaseRowProject = ProjectDTO & ProjectCapacities;

type UnallocatedProject = BaseRowProject & {
  allocatedStudentId: undefined;
  allocatedStudentName: undefined;
};

type AllocatedProject = BaseRowProject & {
  allocatedStudentId: string;
  allocatedStudentName: string;
};

export const project__AllocatedStudents_Capacities_Schema =
  projectDtoSchema.extend({
    capacityLowerBound: z.number(),
    capacityUpperBound: z.number(),
    allocatedStudents: z.array(userDtoSchema),
  });

export type Project__AllocatedStudents_Capacities = z.infer<
  typeof project__AllocatedStudents_Capacities_Schema
>;

export function formatSupervisorRowProjects(
  supervisorProjects: Project__AllocatedStudents_Capacities[],
): (AllocatedProject | UnallocatedProject)[] {
  return supervisorProjects.flatMap((project) => {
    const { allocatedStudents, preAllocatedStudentId, ...rest } = project;

    // ! breaks if pre-allocated student is removed
    if (preAllocatedStudentId) {
      const idx = allocatedStudents.findIndex(
        (a) => a.id === preAllocatedStudentId,
      );

      if (idx === -1) {
        return {
          ...rest,
          allocatedStudentId: undefined,
          allocatedStudentName: undefined,
        };
      }

      return {
        ...rest,
        allocatedStudentId: preAllocatedStudentId,
        allocatedStudentName: allocatedStudents[idx].name,
      };
    }

    if (allocatedStudents.length === 0) {
      return {
        ...rest,
        allocatedStudentId: undefined,
        allocatedStudentName: undefined,
      };
    }

    return allocatedStudents.map((allocation) => ({
      ...rest,
      allocatedStudentId: allocation.id,
      allocatedStudentName: allocation.name,
    }));
  });
}
