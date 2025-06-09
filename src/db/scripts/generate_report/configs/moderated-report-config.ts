import {
  ReportConfig,
  StudentEntry,
  ReportMaps,
} from "../shared/pdf-generator";
import { loadMapsStatically } from "../shared/map-loaders";

import ModeratedSummary, {
  type ModeratedSummaryProps,
} from "@/emails/messages/external-examiner/moderated-summary";

const MARKING_GROUP = "level4";

function transformDataForTemplate(
  entry: StudentEntry,
  maps: ReportMaps,
): ModeratedSummaryProps {
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
    thirdMarkerDissertationSubmission: entry.readerDissertationSubmission,
    finalMark: entry.final.grade,
  };
}

export const moderatedReportConfig: ReportConfig = {
  markingGroup: MARKING_GROUP,
  inputFile: "./src/db/scripts/data/input/moderated_data.t.json",
  outputDir: `./src/db/scripts/data/out/${MARKING_GROUP}/moderated`,
  templateComponent: ModeratedSummary,
  transformDataForTemplate,
  getMaps: () => loadMapsStatically(MARKING_GROUP),
};
