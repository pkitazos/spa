import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { ByProjectDataTable } from "./_components/by-project-data-table";
import { ByStudentDataTable } from "./_components/by-student-data-table";
import { BySupervisorDataTable } from "./_components/by-supervisor-data-table";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.allocationOverview.title,
      displayName,
      app.name,
    ]),
  };
}
export default async function Page({ params }: { params: InstanceParams }) {
  const { byStudent, byProject, bySupervisor } =
    await api.institution.instance.projectAllocations({ params });

  return (
    <PanelWrapper className="mt-10 flex w-full flex-col items-start gap-3 px-12">
      <SubHeading className="mb-6">Final Allocation</SubHeading>
      <Tabs defaultValue="student" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger
            className="w-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            value="student"
          >
            By Student
          </TabsTrigger>
          <TabsTrigger
            className="w-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            value="project"
          >
            By Project
          </TabsTrigger>
          <TabsTrigger
            className="w-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            value="supervisor"
          >
            By Supervisor
          </TabsTrigger>
        </TabsList>
        <Separator className="my-4" />
        <TabsContent value="student">
          <ByStudentDataTable data={byStudent} />
        </TabsContent>
        <TabsContent value="project">
          <ByProjectDataTable data={byProject} />
        </TabsContent>
        <TabsContent value="supervisor">
          <BySupervisorDataTable data={bySupervisor} />
        </TabsContent>
      </Tabs>
    </PanelWrapper>
  );
}
