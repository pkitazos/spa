import { ReactElement } from "react";

import {
  AssessmentCriterionDTO,
  CriterionScoreDTO,
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

  public async notifyNegotiate({
    supervisor,
    reader,
    project,
    student,
    criteria,
    supervisorSubmission,
    readerSubmission,
    unit,
    params,
    deadline,
  }: {
    supervisor: SupervisorDTO;
    reader: ReaderDTO;
    project: ProjectDTO;
    student: StudentDTO;
    criteria: AssessmentCriterionDTO[];
    supervisorSubmission: MarkingSubmissionDTO;
    readerSubmission: MarkingSubmissionDTO;
    unit: UnitOfAssessmentDTO;
    params: InstanceParams;
    deadline: Date;
  }) {
    const subject = "Grading Negotiation Required";
    await Promise.all([
      this.sendMail({
        message: (
          <SupervisorNegotiate1
            project={project}
            reader={reader}
            student={student}
            supervisorSubmission={supervisorSubmission}
            readerSubmission={readerSubmission}
            criteria={criteria}
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
            supervisorSubmission={supervisorSubmission}
            readerSubmission={readerSubmission}
            criteria={criteria}
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
            supervisorGrade={supervisorSubmission.grade}
            readerGrade={readerSubmission.grade}
            deadline={deadline}
          />
        ),
        subject,
        to: ["Paul.Harvey@glasgow.ac.uk"],
      }),
    ]);
  }

  public async notifyModeration({
    project,
    reader,
    student,
    unit,
    supervisor,
    deadline,
    criteria,
    supervisorSubmission,
    readerSubmission,
    negotiationResult,
  }: {
    project: ProjectDTO;
    reader: ReaderDTO;
    student: StudentDTO;
    unit: UnitOfAssessmentDTO;
    supervisor: SupervisorDTO;
    deadline: Date;
    criteria: AssessmentCriterionDTO[];
    supervisorSubmission: MarkingSubmissionDTO;
    readerSubmission: MarkingSubmissionDTO;
    negotiationResult?: CriterionScoreDTO;
  }) {
    const subject = "Grading Negotiation Required";
    await Promise.all([
      this.sendMail({
        message: (
          <CoordinatorModeration
            project={project}
            reader={reader}
            student={student}
            unit={unit}
            supervisor={supervisor}
            deadline={deadline}
            criteria={criteria}
            supervisorSubmission={supervisorSubmission}
            readerSubmission={readerSubmission}
            negotiationResult={negotiationResult}
          />
        ),
        subject,
        to: ["Paul.Harvey@glasgow.ac.uk"],
      }),
    ]);
  }
}
