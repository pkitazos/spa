import { Stage } from "@prisma/client";
import { z } from "zod";

export const stageSchema = z.enum([
  Stage.SETUP,
  Stage.PROJECT_SUBMISSION,
  Stage.PROJECT_SELECTION,
  Stage.PROJECT_ALLOCATION,
  Stage.ALLOCATION_ADJUSTMENT,
  Stage.ALLOCATION_PUBLICATION,
  Stage.READER_BIDDING,
  Stage.READER_ALLOCATION,
  Stage.MARKING,
  Stage.FINAL_GRADES_RELEASED,
]);

export const supervisorStages: Stage[] = [Stage.SETUP];

export const studentStages: Stage[] = [Stage.SETUP, Stage.PROJECT_SUBMISSION];
