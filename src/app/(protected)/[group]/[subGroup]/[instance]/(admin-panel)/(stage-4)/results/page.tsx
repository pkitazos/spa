import { GraduationCapIcon, Users2Icon } from "lucide-react";

import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { StudentResultsSection } from "./_components/student-results-section";
import { SupervisorResultsSection } from "./_components/supervisor-results-section";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.results.title, displayName, app.name]),
  };
}

export default function Page() {
  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <div className="flex w-full flex-col gap-3">
        <SubHeading className="mb-6">{PAGES.results.title}</SubHeading>
        <Accordion type="multiple">
          <AccordionItem className="border-b-0" value="by-supervisors">
            <AccordionTrigger className="mb-4 rounded-md px-5 py-4 hover:bg-accent hover:no-underline">
              <SectionHeading className="flex items-center">
                <Users2Icon className="mr-2 h-6 w-6 text-indigo-500" />
                <span>By Supervisors</span>
              </SectionHeading>
            </AccordionTrigger>
            <AccordionContent>
              <SupervisorResultsSection />
            </AccordionContent>
          </AccordionItem>
          <Separator className="mb-5" />
          <AccordionItem className="border-b-0" value="by-students">
            <AccordionTrigger className="mb-4 rounded-md px-5 py-4 hover:bg-accent hover:no-underline">
              <SectionHeading className="flex items-center">
                <GraduationCapIcon className="mr-2 h-6 w-6 text-indigo-500" />
                <span>By Students</span>
              </SectionHeading>
            </AccordionTrigger>
            <AccordionContent>
              <StudentResultsSection />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </PanelWrapper>
  );
}
