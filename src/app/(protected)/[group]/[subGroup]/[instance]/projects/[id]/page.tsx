import { Fragment } from "react";

import {
  BookmarkIcon,
  FlagIcon,
  FolderCheckIcon,
  TagIcon,
  TextIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { type ProjectDTO, type StudentDTO, type SupervisorDTO } from "@/dto";

import { Role, Stage } from "@/db/types";

import { ConditionalRender } from "@/components/access-control";
import { ConditionalDisable } from "@/components/access-control/conditional-render";
import { Heading, SectionHeading } from "@/components/heading";
import { InstanceLink } from "@/components/instance-link";
import { MarkdownRenderer } from "@/components/markdown-editor";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { toPP1 } from "@/lib/utils/general/instance-params";
import { toPositional } from "@/lib/utils/general/to-positional";
import { previousStages } from "@/lib/utils/permissions/stage-check";
import { type InstanceParams } from "@/lib/validations/params";
import { type StudentPreferenceType } from "@/lib/validations/student-preference";

import { StudentPreferenceButton } from "./_components/student-preference-button";
import { StudentPreferenceDataTable } from "./_components/student-preference-data-table";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: PageParams }) {
  const exists = await api.project.exists({ params: toPP1(params) });
  if (!exists) notFound();

  const { displayName } = await api.institution.instance.get({ params });
  const { title } = await api.project.getById({
    params: { ...params, projectId: params.id },
  });

  return {
    title: metadataTitle([
      title,
      PAGES.allProjects.title,
      displayName,
      app.name,
    ]),
  };
}

// TODO: this is super messy and should be reviewed and fixed a lil

export default async function Project({ params }: { params: PageParams }) {
  const projectId = params.id;
  const exists = await api.project.exists({ params: toPP1(params) });
  if (!exists) notFound();

  const instancePath = formatParamsAsPath(params);

  const userAccess = await api.ac.projectAccess({ params: toPP1(params) });

  if (!userAccess.access) {
    return (
      <Unauthorised
        message={`This project is not suitable for ${userAccess.error} students`}
      />
    );
  }

  const { project, supervisor } = await api.project.getByIdWithSupervisor({
    params: toPP1(params),
  });
  const user = await api.user.get();
  const roles = await api.user.roles({ params });

  let preAllocated = false;
  let preferenceStatus: StudentPreferenceType = "None";

  if (roles.has(Role.STUDENT)) {
    preAllocated = !!(await api.user.student.isPreAllocated({ params }));
    preferenceStatus = await api.user.student.preference.getForProject({
      params,
      projectId,
    });
  }

  const studentPreferences = await api.project.getAllStudentPreferences({
    params: toPP1(params),
  });

  const allocatedStudent = await api.project.getAllocation({
    params: toPP1(params),
  });

  const projectDescriptors =
    await api.institution.instance.getAllProjectDescriptors({ params });

  return (
    <PanelWrapper>
      <Heading
        className={cn(
          "flex items-center justify-between gap-2 text-4xl",
          project.title.length > 30 && "text-3xl",
        )}
      >
        {project.title}
        <ConditionalRender
          allowedRoles={[Role.STUDENT]}
          allowedStages={[Stage.STUDENT_BIDDING]}
          overrides={{ roles: { AND: !preAllocated } }}
          allowed={
            <StudentPreferenceButton
              projectId={projectId}
              defaultStatus={preferenceStatus}
            />
          }
        />

        <ConditionalDisable
          allowedRoles={[Role.ADMIN]}
          allowedStages={previousStages(Stage.STUDENT_BIDDING)}
          overrides={{ roles: { OR: project.supervisorId === user.id } }}
        >
          <InstanceLink
            className={cn(buttonVariants(), "min-w-32 text-nowrap")}
            href={`projects/${projectId}?edit=true`}
          >
            Edit or Delete
          </InstanceLink>
        </ConditionalDisable>
        {/* allowed={
            // pin - broken link
          }
          denied={(denialData) => (
            <WithTooltip tip={<FormatDenials {...denialData} />}>
              <Button className="min-w-32 text-nowrap" disabled>
                Edit or Delete
              </Button>
            </WithTooltip>
          )}
        /> */}
      </Heading>

      <div className="mt-6 flex gap-6">
        <div className="flex w-3/4 flex-col gap-16">
          <section className="flex flex-col">
            <SectionHeading className="mb-2 flex items-center">
              <TextIcon className="mr-2 h-6 w-6 text-indigo-500" />
              <span>Description</span>
            </SectionHeading>
            <div className="mt-6">
              <MarkdownRenderer source={project.description} />
            </div>
          </section>
        </div>
        <div className="w-1/4">
          <ProjectDetailsCard
            projectData={{ project, supervisor }}
            roles={roles}
          />
        </div>
      </div>

      <ConditionalRender
        allowedRoles={[Role.ADMIN]}
        overrides={{
          roles: {
            OR: project.supervisorId === user.id,
            AND: !!allocatedStudent,
          },
        }}
        allowed={
          <Fragment>
            {allocatedStudent && (
              <section className={cn("mt-16 flex flex-col gap-8")}>
                <SectionHeading icon={FolderCheckIcon}>
                  Allocation
                </SectionHeading>
                <AllocatedStudentCard
                  studentAllocation={allocatedStudent}
                  preAllocated={!!project.preAllocatedStudentId}
                />
              </section>
            )}
            <Separator />
          </Fragment>
        }
      />
      <ConditionalRender
        allowedRoles={[Role.ADMIN]}
        overrides={{ roles: { AND: !project.preAllocatedStudentId } }}
        allowed={
          <section className="mt-16 flex flex-col gap-8">
            <SectionHeading icon={BookmarkIcon}>
              Student Preferences
            </SectionHeading>
            <StudentPreferenceDataTable
              data={studentPreferences}
              projectDescriptors={projectDescriptors}
            />
          </section>
        }
      />
    </PanelWrapper>
  );
}

async function ProjectDetailsCard({
  roles,
  projectData,
}: {
  roles: Set<Role>;
  projectData: { project: ProjectDTO; supervisor: SupervisorDTO };
}) {
  const user = await api.user.get();
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-10 pt-5">
        <ConditionalRender
          allowedRoles={[Role.ADMIN, Role.STUDENT]}
          overrides={{ roles: { OR: projectData.supervisor.id === user.id } }}
          allowed={
            <div className="flex items-center space-x-4">
              <UserIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Supervisor
                </h3>
                {/* // ! this is so dumb */}
                {roles.has(Role.ADMIN) ? (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "p-0 text-lg",
                    )}
                    href={`../${PAGES.allSupervisors.href}/${projectData.supervisor.id}`}
                  >
                    {projectData.supervisor.name}
                  </Link>
                ) : (
                  <p className="text-lg font-semibold">
                    {projectData.supervisor.name}
                  </p>
                )}
              </div>
            </div>
          }
        />
        <div className={cn(projectData.project.flags.length === 0 && "hidden")}>
          <div className="mb-2 flex items-center space-x-4">
            <FlagIcon className="h-6 w-6 text-fuchsia-500" />
            <h3 className="text-sm font-medium text-muted-foreground">Flags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {projectData.project.flags.map((flag, i) => (
              <Badge className="rounded-md" variant="accent" key={i}>
                {flag.displayName}
              </Badge>
            ))}
          </div>
        </div>
        <div className={cn(projectData.project.tags.length === 0 && "hidden")}>
          <div className="mb-2 flex items-center space-x-4">
            <TagIcon className="h-6 w-6 text-purple-500" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Keywords
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {projectData.project.tags.map((tag, i) => (
              <Badge className="w-max" key={i} variant="outline">
                {tag.title}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// TODO: standardise params type
function AllocatedStudentCard({
  studentAllocation,
  preAllocated,
}: {
  studentAllocation: { student: StudentDTO; rank: number };
  preAllocated: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Card className="w-fit max-w-sm border-none bg-accent px-6 py-3">
        <CardContent className="flex flex-col p-0">
          <div className="flex items-center space-x-4">
            <UserIcon className="h-6 w-6 flex-none text-blue-500" />
            <div className="flex flex-col">
              <h3 className="-mb-1 text-sm font-medium text-muted-foreground">
                Student
              </h3>
              <Link
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "text-nowrap p-0 text-base",
                )}
                href={`../${PAGES.allStudents.href}/${studentAllocation.student.id}`}
              >
                {studentAllocation.student.name}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      {preAllocated ? (
        <p>The student self-defined this project.</p>
      ) : (
        <p>
          This was the student&apos;s{" "}
          <span className="font-semibold text-indigo-600">
            {toPositional(studentAllocation.rank)}
          </span>{" "}
          choice.
        </p>
      )}
    </div>
  );
}
