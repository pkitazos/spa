import fs from "fs";
import { AssessmentCriterionDTO } from "@/dto";
import { PrismaClient } from "@prisma/client";
import { LEVEL4_CONFIG } from "./data/misc/units_of_assessment_by_flag";

const group = "socs";
const subGroup = "lvl-4-and-lvl-5-honours";
const instance = "2024-2025";

const params = { group, subGroup, instance };

const db = new PrismaClient();

const CONFIG = LEVEL4_CONFIG;
const MARKING_GROUP = CONFIG.MARKING_GROUP;
const OUTPUT_DIR = `./src/db/scripts/data/criteria/${MARKING_GROUP}`;

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const conductCriterion: AssessmentCriterionDTO[] =
    await db.assessmentCriterion.findMany({
      where: { id: CONFIG.CONDUCT.CONDUCT },
    });

  fs.writeFileSync(
    `${OUTPUT_DIR}/conductCriterion.ts`,
    `export const CONDUCT_CRITERIA = ${JSON.stringify(conductCriterion, null, 2)}`,
  );

  const presentationCriteria: AssessmentCriterionDTO[] =
    await db.assessmentCriterion.findMany({
      where: {
        id: {
          in: [
            CONFIG.PRESENTATION.CONTENT,
            CONFIG.PRESENTATION.DELIVERY,
            CONFIG.PRESENTATION.VISUAL_AIDS,
          ],
        },
      },
    });

  fs.writeFileSync(
    `${OUTPUT_DIR}/presentationCriteria.ts`,
    `export const PRESENTATION_CRITERIA = ${JSON.stringify(presentationCriteria, null, 2)}`,
  );

  const dissertationCriteria: AssessmentCriterionDTO[] =
    await db.assessmentCriterion.findMany({
      where: {
        id: {
          in: [
            CONFIG.DISSERTATION.ANALYSIS,
            CONFIG.DISSERTATION.EVALUATION,
            CONFIG.DISSERTATION.DISSERTATION_QUALITY,
            CONFIG.DISSERTATION.DESIGN,
          ],
        },
      },
    });

  fs.writeFileSync(
    `${OUTPUT_DIR}/dissertationCriteria.ts`,
    `export const DISSERTATION_CRITERIA = ${JSON.stringify(dissertationCriteria, null, 2)}`,
  );
}

main()
  .catch(async (e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
