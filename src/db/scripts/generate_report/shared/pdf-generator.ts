// shared/pdf-generator.ts
import React from "react";
// @ts-ignore
global.React = React;

import { render } from "@react-email/render";
import fs from "fs";
import puppeteer from "puppeteer";
import {
  AssessmentCriterionDTO,
  markingSubmissionDtoSchema,
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  SupervisorDTO,
} from "@/dto";
import { z } from "zod";

export const studentEntrySchema = z.object({
  student: z.string(),
  supervisor: z.string(),
  reader: z.string(),
  supervisorConductSubmission: markingSubmissionDtoSchema,
  supervisorPresentationSubmission: markingSubmissionDtoSchema,
  supervisorDissertationSubmission: markingSubmissionDtoSchema,
  readerDissertationSubmission: markingSubmissionDtoSchema,
  final: z.object({
    comment: z.string(),
    grade: z.number(),
    letterGrade: z.string(),
  }),
});

export type StudentEntry = z.infer<typeof studentEntrySchema>;

export interface ReportMaps {
  STUDENTS_MAP: Record<string, StudentDTO>;
  PROJECTS_MAP: Record<string, ProjectDTO>;
  SUPERVISORS_MAP: Record<string, SupervisorDTO>;
  READERS_MAP: Record<string, ReaderDTO>;
  SPA_MAP: Record<string, string>;
  CONDUCT_CRITERIA: AssessmentCriterionDTO[];
  DISSERTATION_CRITERIA: AssessmentCriterionDTO[];
  PRESENTATION_CRITERIA: AssessmentCriterionDTO[];
}

export interface ReportConfig {
  markingGroup: string;
  inputFile: string;
  outputDir: string;
  // todo: props and return type for the template component should match
  templateComponent: (props: any) => React.ReactElement;
  transformDataForTemplate: (entry: StudentEntry, maps: ReportMaps) => any;
  getMaps: () => Promise<ReportMaps>;
}

export async function generatePDFBuffer(html: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();
  return pdf;
}

export async function runReportGeneration(config: ReportConfig) {
  if (!fs.existsSync(config.inputFile)) {
    console.error(`Input file ${config.inputFile} does not exist.`);
    return;
  }

  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  const maps = await config.getMaps();

  const rawData = fs.readFileSync(config.inputFile, "utf8");
  const data = z.array(studentEntrySchema).parse(JSON.parse(rawData));

  for (const entry of data) {
    if (!maps.STUDENTS_MAP[entry.student]) {
      console.error(`Student ${entry.student} not found`);
      continue;
    }
    if (!maps.PROJECTS_MAP[maps.SPA_MAP[entry.student]]) {
      console.error(`Project for student ${entry.student} not found`);
      continue;
    }
    if (!maps.SUPERVISORS_MAP[entry.supervisor]) {
      console.error(`Supervisor ${entry.supervisor} not found`);
      continue;
    }
    if (!maps.READERS_MAP[entry.reader]) {
      console.error(`Reader ${entry.reader} not found`);
      continue;
    }

    console.log("Processing student:", entry.student);

    const templateData = config.transformDataForTemplate(entry, maps);
    const html = await render(config.templateComponent(templateData));
    const pdfBuffer = await generatePDFBuffer(html);

    fs.writeFileSync(`${config.outputDir}/${entry.student}.pdf`, pdfBuffer);

    console.log(`PDF generated successfully!\n`);
  }
}
