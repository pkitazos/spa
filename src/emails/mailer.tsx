import { ReactElement } from "react";
import AutoResolveSuccess from "./messages/auto-resolve-success/v1";
import {
  AssessmentCriterionDTO,
  MarkingSubmissionDTO,
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  SupervisorDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import SupervisorNegotiate1 from "./messages/negotiate-1/supervisor";
import ReaderNegotiate1 from "./messages/negotiate-1/reader";
import SupervisorNegotiate2 from "./messages/negotiate-2/supervisor";
import ReaderNegotiate2 from "./messages/negotiate-2/reader";
import { InstanceParams } from "@/lib/validations/params";

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

  public async notifyAutoResolve(
    student: StudentDTO,
    grade: string,
    supervisor: SupervisorDTO,
    reader: ReaderDTO,
  ) {
    const message = <AutoResolveSuccess student={student} grade={grade} />;
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
          <SupervisorNegotiate2
            project={project}
            reader={reader}
            student={student}
          />
        ),
        subject,
        to: [supervisor.email],
      }),
    ]);
    await Promise.all([
      this.sendMail({
        message: (
          <ReaderNegotiate2
            project={project}
            supervisor={supervisor}
            student={student}
          />
        ),
        subject,
        to: [reader.email],
      }),
    ]);
  }
}
