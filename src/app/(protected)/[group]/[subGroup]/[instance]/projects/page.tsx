import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { type PreferenceType, Role } from "@/db/types";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { AllProjectsDataTable } from "./_components/all-projects-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.allProjects.title, displayName, app.name]),
  };
}

export default async function Projects({ params }: { params: InstanceParams }) {
  const { mask: user } = await auth();

  const roles = await api.user.roles({ params });
  const projectData = await api.project.getAllForUser({ params });

  // TODO: fix this it's kinda janky
  let projectPreferences: Record<string, PreferenceType> = {};

  if (roles.has(Role.STUDENT)) {
    projectPreferences = await api.user.student.preference.getByProject({
      params,
    });
  }

  const hasSelfDefinedProject = await api.user.hasSelfDefinedProject({
    params,
  });

  return (
    <PanelWrapper>
      <Heading>{PAGES.allProjects.title}</Heading>
      <AllProjectsDataTable
        user={user}
        roles={roles}
        data={projectData}
        projectPreferences={projectPreferences}
        hasSelfDefinedProject={hasSelfDefinedProject}
      />
    </PanelWrapper>
  );
}
