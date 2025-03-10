import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import projects from "./data/Project.json";
import tagsOnProjects from "./data/TagOnProject.json";
import flagsOnProjects from "./data/FlagOnProject.json";

export async function projects_and_pre_allocations(
  db: PrismaClient,
  params: InstanceParams,
) {
  const projectData = projects
    .filter(
      (x) =>
        x.allocation_group_id === params.group &&
        x.allocation_sub_group_id === params.subGroup &&
        x.allocation_instance_id === params.instance,
    )
    .map((x) => ({
      id: x.id,
      title: x.title,
      description: x.description,
      capacityLowerBound: x.capacity_lower_bound,
      capacityUpperBound: x.capacity_upper_bound,
      supervisorId: x.supervisor_id,
      preAllocatedStudentId: x.pre_allocated_student_id,
      specialTechnicalRequirements: x.special_technical_requirements,
      extraInformation: x.extra_information,
      latestEditDateTime: new Date(x.latest_edit_date_time),
      ...expand(params),
    }));

  const tagOnProjectData = tagsOnProjects;

  const flagOnProjectData = flagsOnProjects;

  await db.$transaction([
    db.project.createMany({ data: projectData, skipDuplicates: true }),

    db.tagOnProject.createMany({ data: [], skipDuplicates: true }),

    db.flagOnProject.createMany({ data: [], skipDuplicates: true }),
  ]);
}
