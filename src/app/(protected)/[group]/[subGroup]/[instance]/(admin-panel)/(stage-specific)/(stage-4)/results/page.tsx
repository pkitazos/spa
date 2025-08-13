import { GraduationCapIcon, Users2Icon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { StudentResultsSection } from "./_components/student-results-section";
import { SupervisorResultsSection } from "./_components/supervisor-results-section";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return { title: metadataTitle([PAGES.results.title, displayName, app.name]) };
}

export default function Page() {
  return (
    <PanelWrapper className="gap-16">
      <div className="flex w-full flex-col gap-3">
        <Heading className="mb-6">{PAGES.results.title}</Heading>
        <Accordion type="multiple">
          <AccordionItem className="border-b-0" value="by-supervisors">
            <AccordionTrigger className="mb-4 rounded-md px-5 py-4 hover:bg-accent hover:no-underline">
              <SectionHeading icon={Users2Icon}>By Supervisors</SectionHeading>
            </AccordionTrigger>
            <AccordionContent>
              <SupervisorResultsSection />
            </AccordionContent>
          </AccordionItem>
          <Separator className="mb-5" />
          <AccordionItem className="border-b-0" value="by-students">
            <AccordionTrigger className="mb-4 rounded-md px-5 py-4 hover:bg-accent hover:no-underline">
              <SectionHeading icon={GraduationCapIcon}>
                By Students
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
