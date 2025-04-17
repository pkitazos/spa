import { ReactElement } from "react";

import {
  AssessmentCriterionDTO,
  MarkingSubmissionDTO,
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  SupervisorDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import SupervisorNegotiate1 from "./messages/negotiation/supervisor";
import ReaderNegotiate1 from "./messages/negotiation/reader";
import CoordinatorModeration from "./messages/moderation/coordinator";
import { InstanceParams } from "@/lib/validations/params";
import MarkingComplete from "./messages/marking-complete";

export type SendMail = ({
  message,
  to,
  subject,
  cc,
}: {
  message: ReactElement;
  subject: string;
  to: string[];
  cc?: string[];
}) => Promise<void>;

export class Mailer {
  private sendMail: SendMail;

  public constructor(sendMail: SendMail) {
    this.sendMail = sendMail;
  }

  public async notifyMarkingComplete(
    student: StudentDTO,
    supervisor: SupervisorDTO,
    reader: ReaderDTO,
    project: ProjectDTO,
    unit: UnitOfAssessmentDTO,
    grade: string,
  ) {
    const message = (
      <MarkingComplete
        student={student}
        grade={grade}
        project={project}
        unit={unit}
      />
    );
    const subject = "Grading Auto-resolve succeeded";

    await Promise.all([
      this.sendMail({ message, subject, to: [supervisor.email] }),
      this.sendMail({ message, subject, to: [reader.email] }),
    ]);
  }

  public async notifyNegotiate1(
    supervisor: SupervisorDTO,
    reader: ReaderDTO,
    project: ProjectDTO,
    student: StudentDTO,
    readerMarking: {
      submission: MarkingSubmissionDTO;
      criteria: AssessmentCriterionDTO[];
      overallGrade: number;
    },
    supervisorMarking: {
      submission: MarkingSubmissionDTO;
      criteria: AssessmentCriterionDTO[];
      overallGrade: number;
    },
    unit: UnitOfAssessmentDTO,
    params: InstanceParams,
  ) {
    const subject = "Grading Negotiation Required";
    await Promise.all([
      this.sendMail({
        message: (
          <SupervisorNegotiate1
            project={project}
            reader={reader}
            student={student}
            supervisorMarking={supervisorMarking}
            readerMarking={readerMarking}
            unit={unit}
            params={params}
          />
        ),
        subject,
        to: [supervisor.email],
      }),
    ]);
    await Promise.all([
      this.sendMail({
        message: (
          <ReaderNegotiate1
            project={project}
            supervisor={supervisor}
            student={student}
            supervisorMarking={supervisorMarking}
            readerMarking={readerMarking}
            unit={unit}
          />
        ),
        subject,
        to: [reader.email],
      }),
    ]);
  }

  public async notifyNegotiate2(
    supervisor: SupervisorDTO,
    reader: ReaderDTO,
    project: ProjectDTO,
    student: StudentDTO,
  ) {
    const subject = "Grading Negotiation Required";
    await Promise.all([
      this.sendMail({
        message: (
          <CoordinatorModeration
            project={project}
            reader={reader}
            student={student}
          />
        ),
        subject,
        to: ["Paul.Harvey@glasgow.ac.uk"],
      }),
    ]);
  }
}
