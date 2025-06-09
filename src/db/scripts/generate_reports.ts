import React from "react";
// @ts-ignore
global.React = React;

import { render } from "@react-email/render";
import fs from "fs";
import puppeteer from "puppeteer";

import { markingSubmissionDtoSchema } from "@/dto";
import Summary, {
  type SummaryProps,
} from "@/emails/messages/external-examiner/summary";
import { z } from "zod";
import { CONDUCT_CRITERIA } from "./criteria/level4/conductCriterion";
import { DISSERTATION_CRITERIA } from "./criteria/level4/dissertationCriteria";
import { PRESENTATION_CRITERIA } from "./criteria/level4/presentationCriteria";
import { PROJECTS_MAP } from "./maps/level4/projectsMap";
import { READERS_MAP } from "./maps/level4/readersMap";
import { SPA_MAP } from "./maps/level4/spaMap";
import { STUDENTS_MAP } from "./maps/level4/studentsMap";
import { SUPERVISORS_MAP } from "./maps/level4/supervisorsMap";

const MARKING_GROUP = "level4";
const INPUT_FILE = `./src/db/scripts/input/${MARKING_GROUP}/no_submission_data.t.json`;
const OUTPUT_DIR = `./src/db/scripts/out/${MARKING_GROUP}/no_submission`;

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file ${INPUT_FILE} does not exist.`);
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const rawData = fs.readFileSync(INPUT_FILE, "utf8");
  const data = z.array(studentEntrySchema).parse(JSON.parse(rawData));

  for (const entry of data) {
    if (!STUDENTS_MAP[entry.student]) {
      console.error(`Student ${entry.student} not found`);
      continue;
    }
    if (!PROJECTS_MAP[SPA_MAP[entry.student]]) {
      console.error(`Project for student ${entry.student} not found`);
      continue;
    }
    if (!SUPERVISORS_MAP[entry.supervisor]) {
      console.error(`Supervisor ${entry.supervisor} not found`);
      continue;
    }
    if (!READERS_MAP[entry.reader]) {
      console.error(`Reader ${entry.reader} not found`);
      continue;
    }

    console.log("Processing student:", entry.student);

    const templateData = transformDataForTemplate(entry);

    const html = await render(Summary(templateData));

    const pdfBuffer = await generatePDFBuffer(html);

    fs.writeFileSync(`${OUTPUT_DIR}/${entry.student}.pdf`, pdfBuffer);

    console.log(`PDF generated successfully!\n`);
  }
}

const studentEntrySchema = z.object({
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

type StudentEntry = z.infer<typeof studentEntrySchema>;

async function generatePDFBuffer(html: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();
  return pdf;
}

function transformDataForTemplate(entry: StudentEntry): SummaryProps {
  return {
    student: STUDENTS_MAP[entry.student],
    project: PROJECTS_MAP[SPA_MAP[entry.student]],
    supervisor: SUPERVISORS_MAP[entry.supervisor],
    reader: READERS_MAP[entry.reader],
    presentationCriteria: PRESENTATION_CRITERIA,
    conductCriteria: CONDUCT_CRITERIA,
    dissertationCriteria: DISSERTATION_CRITERIA,
    supervisorConductSubmission: entry.supervisorConductSubmission,
    supervisorPresentationSubmission: entry.supervisorPresentationSubmission,
    supervisorDissertationSubmission: entry.supervisorDissertationSubmission,
    readerDissertationSubmission: entry.readerDissertationSubmission,
    finalMark: entry.final.grade,
  };
}

main().catch(console.error);
