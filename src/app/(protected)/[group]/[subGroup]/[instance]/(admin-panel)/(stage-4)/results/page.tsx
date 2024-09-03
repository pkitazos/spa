import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { StudentResultsSection } from "./_components/student-results-section";
import { SupervisorResultsSection } from "./_components/supervisor-results-section";

import { app, metadataTitle } from "@/content/config/app";
import { pages } from "@/content/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([pages.results.title, displayName, app.name]),
  };
}

export default function Page() {
  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <div className="flex w-full flex-col gap-3">
        <SubHeading className="mb-6">{pages.results.title}</SubHeading>
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>By Students</AccordionTrigger>
            <AccordionContent>
              <StudentResultsSection />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>By Supervisors</AccordionTrigger>
            <AccordionContent>
              <SupervisorResultsSection />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </PanelWrapper>
  );
}