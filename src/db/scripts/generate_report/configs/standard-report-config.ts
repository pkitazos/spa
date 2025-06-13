import {
  ReportConfig,
  StudentEntry,
  ReportMaps,
} from "../shared/pdf-generator";
import { loadMapsStatically } from "../shared/map-loaders";

import Summary, {
  type SummaryProps,
} from "@/emails/messages/external-examiner/summary";
import { LEVEL4_CONFIG } from "../../data/misc/units_of_assessment_by_flag";

const CONFIG = LEVEL4_CONFIG;
const MARKING_GROUP = CONFIG.MARKING_GROUP;

function transformDataForTemplate(
  entry: StudentEntry,
  maps: ReportMaps,
): SummaryProps {
  return {
    student: maps.STUDENTS_MAP[entry.student],
    project: maps.PROJECTS_MAP[maps.SPA_MAP[entry.student]],
    supervisor: maps.SUPERVISORS_MAP[entry.supervisor],
    reader: maps.READERS_MAP[entry.reader],
    presentationCriteria: maps.PRESENTATION_CRITERIA,
    conductCriteria: maps.CONDUCT_CRITERIA,
    dissertationCriteria: maps.DISSERTATION_CRITERIA,
    supervisorConductSubmission: entry.supervisorConductSubmission,
    supervisorPresentationSubmission: entry.supervisorPresentationSubmission,
    supervisorDissertationSubmission: entry.supervisorDissertationSubmission,
    readerDissertationSubmission: entry.readerDissertationSubmission,
    finalMark: entry.final.grade,
  };
}

export const standardReportConfig: ReportConfig = {
  markingGroup: MARKING_GROUP,
  inputFile: `./src/db/scripts/data/input/${MARKING_GROUP}/no_submission_data.t.json`,
  outputDir: `./src/db/scripts/data/out/${MARKING_GROUP}/no_submission`,
  templateComponent: Summary,
  transformDataForTemplate,
  getMaps: () => loadMapsStatically(MARKING_GROUP),
};
