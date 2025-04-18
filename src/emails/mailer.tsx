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
import CoordinatorNegotiation from "./messages/negotiation/coordinator";
import { addWeeks } from "date-fns";

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

  public async test() {
    const message = <MarkingComplete {...MarkingComplete.PreviewProps} />;
    await this.sendMail({
      message,
      subject: "Testing...",
      to: ["j.trevor.1@research.gla.ac.uk"],
    });
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

  public async notifyNegotiate(
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
    const deadline = addWeeks(new Date(), 1);

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
            deadline={deadline}
          />
        ),
        subject,
        to: [supervisor.email],
      }),
      this.sendMail({
        message: (
          <ReaderNegotiate1
            project={project}
            supervisor={supervisor}
            student={student}
            supervisorMarking={supervisorMarking}
            readerMarking={readerMarking}
            unit={unit}
            deadline={deadline}
          />
        ),
        subject,
        to: [reader.email],
      }),
      this.sendMail({
        message: (
          <CoordinatorNegotiation
            project={project}
            reader={reader}
            student={student}
            supervisor={supervisor}
            unit={unit}
            supervisorGrade={supervisorMarking.overallGrade}
            readerGrade={readerMarking.overallGrade}
            deadline={deadline}
          />
        ),
        subject,
        to: ["Paul.Harvey@glasgow.ac.uk"],
      }),
    ]);
  }

  public async notifyModeration(
    supervisor: SupervisorDTO,
    reader: ReaderDTO,
    project: ProjectDTO,
    student: StudentDTO,
    unit: UnitOfAssessmentDTO,
    supervisorGrade: number,
    readerGrade: number,
  ) {
    const subject = "Grading Negotiation Required";
    await Promise.all([
      this.sendMail({
        message: (
          <CoordinatorModeration
            supervisor={supervisor}
            reader={reader}
            project={project}
            student={student}
            unit={unit}
            supervisorGrade={supervisorGrade}
            readerGrade={readerGrade}
            deadline={addWeeks(new Date(), 1)}
          />
        ),
        subject,
        to: ["Paul.Harvey@glasgow.ac.uk"],
      }),
    ]);
  }
}
