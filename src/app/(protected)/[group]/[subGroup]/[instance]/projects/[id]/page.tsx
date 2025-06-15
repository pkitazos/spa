import { FlagIcon, TagIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessControl } from "@/components/access-control";
import { Heading, SubHeading } from "@/components/heading";
import { MarkdownRenderer } from "@/components/markdown-editor";
import { PageWrapper } from "@/components/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { toPositional } from "@/lib/utils/general/to-positional";
import { previousStages } from "@/lib/utils/permissions/stage-check";
import { InstanceParams } from "@/lib/validations/params";
import { StudentPreferenceType } from "@/lib/validations/student-preference";

import { StudentPreferenceButton } from "./_components/student-preference-button";
import { StudentPreferenceDataTable } from "./_components/student-preference-data-table";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { PreferenceType, Role, Stage } from "@/db/types";
import { toPP1 } from "@/lib/utils/general/instance-params";
import { ProjectDTO, StudentDTO, SupervisorDTO } from "@/dto";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: PageParams }) {
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

export default async function Project({ params }: { params: PageParams }) {
  const projectId = params.id;
  const exists = await api.project.exists({ params: toPP1(params) });
  if (!exists) notFound();

  const instancePath = formatParamsAsPath(params);

  const userAccess = await api.project.getUserAccess({ params: toPP1(params) });

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

  return (
    <PageWrapper>
      <Heading
        className={cn(
          "flex items-center justify-between gap-2 text-4xl",
          project.title.length > 30 && "text-3xl",
        )}
      >
        {project.title}
        <AccessControl
          allowedRoles={[Role.STUDENT]}
          allowedStages={[Stage.STUDENT_BIDDING]}
          extraConditions={{ RBAC: { AND: !preAllocated } }}
        >
          <StudentPreferenceButton
            projectId={projectId}
            defaultStatus={preferenceStatus}
          />
        </AccessControl>
        <AccessControl
          allowedRoles={[Role.ADMIN]}
          allowedStages={previousStages(Stage.STUDENT_BIDDING)}
          extraConditions={{ RBAC: { OR: project.supervisorId === user.id } }}
        >
          <Link
            className={cn(buttonVariants(), "min-w-32 text-nowrap")}
            href={`${instancePath}/projects/${projectId}/edit`}
          >
            Edit or Delete
          </Link>
        </AccessControl>
      </Heading>

      <div className="mt-6 flex gap-6">
        <div className="flex w-3/4 flex-col gap-16">
          <section className="flex flex-col">
            <SubHeading>Description</SubHeading>
            <div className="mt-6">
              <MarkdownRenderer source={project.description} />
            </div>
          </section>
          <section
            className={cn(
              "flex flex-col",
              project.specialTechnicalRequirements === "" && "hidden",
            )}
          >
            <SubHeading>Special Technical Requirements</SubHeading>
            <p className="mt-6">{project.specialTechnicalRequirements}</p>
          </section>
        </div>
        <div className="w-1/4">
          <ProjectDetailsCard
            projectData={{ project, supervisor }}
            roles={roles}
          />
        </div>
      </div>

      <AccessControl
        allowedRoles={[Role.ADMIN]}
        extraConditions={{
          RBAC: {
            OR: project.supervisorId === user.id,
            AND: !!allocatedStudent,
          },
        }}
      >
        <section className={cn("mt-16 flex flex-col gap-8")}>
          <SubHeading>Allocation</SubHeading>
          <AllocatedStudentCard
            studentAllocation={allocatedStudent!}
            preAllocated={!!project.preAllocatedStudentId}
          />
        </section>
        {/* TODO: fix type errors */}
        {/* <section className="mb-16 flex flex-col">
          <SectionHeading>Special Circumstances</SectionHeading>
          <SpecialCircumstancesPage
            formInternalData={{
              specialCircumstances:
                allocatedStudent?.specialCircumstances ?? "",
            }}
            studentId={allocatedStudent!.id}
            project={{
              id: projectId,
              specialCircumstances:
                allocatedStudent?.specialCircumstances ?? "",
            }}
          />
        </section> */}
        <Separator />
      </AccessControl>
      <AccessControl
        allowedRoles={[Role.ADMIN]}
        extraConditions={{ RBAC: { AND: !project.preAllocatedStudentId } }}
      >
        <section className="mt-16 flex flex-col gap-8">
          <SubHeading>Student Preferences</SubHeading>
          <StudentPreferenceDataTable
            data={studentPreferences.map((s) => ({
              id: s.student.id,
              name: s.student.name,
              level: s.student.level,
              // TODO: fix data table display for submitted projects
              type: s.preference.type as PreferenceType,
              rank: s.preference.rank! ?? NaN,
            }))}
          />
        </section>
      </AccessControl>
    </PageWrapper>
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
    <Card className="w-full max-w-sm border-none bg-accent">
      <CardContent className="flex flex-col gap-10 pt-5">
        <AccessControl
          allowedRoles={[Role.ADMIN, Role.STUDENT]}
          extraConditions={{
            RBAC: { OR: projectData.supervisor.id === user.id },
          }}
        >
          <div className="flex items-center space-x-4">
            <UserIcon className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Supervisor
              </h3>
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
        </AccessControl>
        <div className={cn(projectData.project.flags.length === 0 && "hidden")}>
          <div className="mb-2 flex items-center space-x-4">
            <FlagIcon className="h-6 w-6 text-fuchsia-500" />
            <h3 className="text-sm font-medium text-muted-foreground">Flags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {projectData.project.flags.map((flag, i) => (
              <Badge className="w-max" variant="outline" key={i}>
                {flag.title}
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
