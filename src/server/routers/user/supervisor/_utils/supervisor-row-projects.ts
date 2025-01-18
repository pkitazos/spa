import { StudentDTO } from "@/dto/student";
import {
  BaseProjectDto,
  Project__AllocatedStudents_Capacities,
} from "@/dto/supervisor_router";

type ProjectCapacities = {
  capacityLowerBound: number;
  capacityUpperBound: number;
};

type BaseRowProject = BaseProjectDto & ProjectCapacities;

type UnallocatedProject = BaseRowProject & {
  allocatedStudentId: undefined;
  allocatedStudentName: undefined;
};

type AllocatedProject = BaseRowProject & {
  allocatedStudentId: string;
  allocatedStudentName: string;
};

// ? Maybe something like this would be better
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Row = {
  project: BaseProjectDto;
  student?: StudentDTO & { rank: number };
};

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
