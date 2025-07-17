import { Stage } from "@/db/types";

import { subsequentStages } from "@/lib/utils/permissions/stage-check";

export const supervisorStages: Stage[] = [Stage.SETUP];

export const studentStages: Stage[] = [Stage.SETUP, Stage.PROJECT_SUBMISSION];

export const readerStages: Stage[] = subsequentStages(
  Stage.ALLOCATION_PUBLICATION,
);
