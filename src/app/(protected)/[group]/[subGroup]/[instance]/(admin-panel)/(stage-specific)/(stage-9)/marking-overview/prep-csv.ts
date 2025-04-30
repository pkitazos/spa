import {
  MarkerStatusSummary,
  ProjectMarkingOverview,
  UnitGradingStatus,
  UnitMarkingSummary,
} from "./row";
import { MarkerType } from "@/db/types";
import { Grade } from "@/config/grades";

interface CSVRow {
  studentGUID: string;
  studentName: string;
  studentLevel: number;
  studentEmail: string;
  projectTitle: string;

  supervsorName: string;
  supervisorEmail: string;
  readerName: string;
  readerEmail: string;

  moderatorName?: string;
  moderatorEmail?: string;

  presentationGrade: string;
  conductGrade: string;

  supervisorDissertationGrade: string;
  readerDissertationGrade: string;

  requiredNegotiation: boolean;
  negotiatedGrade?: string;

  requiredModeration: boolean;
  moderatedGrade?: string;

  finalDissertationGrade: string;
  overallGrade: string;
}

export function prepCSV(data: ProjectMarkingOverview[]): CSVRow[] {
  return data.map(({ project, status, student, units }) => {
    const unitMap = units.reduce(
      (acc, val) => ({ ...acc, [val.unit.title]: val }),
      {} as Record<string, UnitMarkingSummary>,
    );

    const dissertation = unitMap["Dissertation"];
    const presentation = unitMap["Presentation"];
    const conduct = unitMap["Conduct"];

    const markerMap = dissertation.markers.reduce(
      (acc, val) => ({ ...acc, [val.markerType]: val }),
      {} as Record<MarkerType, MarkerStatusSummary>,
    );

    const supervisor = markerMap[MarkerType.SUPERVISOR];
    const reader = markerMap[MarkerType.READER];

    const supervisorDissertationGrade = statusToString(supervisor.status);
    const readerDissertationGrade = statusToString(reader.status);

    const dissStatus = Grade.autoResolve(
      supervisorDissertationGrade,
      readerDissertationGrade,
    );

    const requiredNegotiation =
      dissStatus.status === "NEGOTIATE1" || dissStatus.status === "NEGOTIATE2";

    const dissGrade =
      dissertation.status.status === "MARKED"
        ? dissertation.status.grade
        : undefined;

    const requiredModeration =
      dissStatus.status === "MODERATE" ||
      (dissGrade &&
        Grade.checkExtremes(Grade.toLetter(dissGrade)).status === "MODERATE") ||
      false;

    return {
      studentGUID: student.id,
      studentName: student.name,
      studentLevel: student.level,
      studentEmail: student.email,
      projectTitle: project.title,

      supervsorName: supervisor.marker.name,
      supervisorEmail: supervisor.marker.email,
      readerName: reader.marker.name,
      readerEmail: reader.marker.email,

      moderatorName: requiredModeration ? "Paul Harvey" : undefined,
      moderatorEmail: requiredModeration
        ? "Paul.Harvey@glasgow.ac.uk"
        : undefined,

      presentationGrade: statusToString(presentation.status) ?? "",
      conductGrade: statusToString(conduct.status) ?? "",
      supervisorDissertationGrade: supervisorDissertationGrade ?? "",
      readerDissertationGrade: readerDissertationGrade ?? "",

      requiredNegotiation,
      negotiatedGrade: requiredNegotiation
        ? statusToString(dissertation.status)
        : undefined,
      requiredModeration,
      moderatedGrade: undefined,
      finalDissertationGrade: statusToString(dissertation.status) ?? "",
      overallGrade: statusToString(status) ?? "",
    };
  });
}

function statusToString(data: UnitGradingStatus): string | undefined {
  if (data.status === "MARKED") return Grade.toLetter(data.grade);
  return undefined;
}
