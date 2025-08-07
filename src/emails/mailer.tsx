import { type ReactElement } from "react";

import { PAUL_EMAIL, tag_coordinator } from "@/config/emails";

import {
  type AssessmentCriterionDTO,
  type CriterionScoreDTO,
  type MarkingSubmissionDTO,
  type ProjectDTO,
  type ReaderDTO,
  type StudentDTO,
  type SupervisorDTO,
  type UnitOfAssessmentDTO,
  type UserDTO,
} from "@/dto";

import { type InstanceParams } from "@/lib/validations/params";

import MarkingComplete from "./messages/marking-complete";
import MarkingOverdueGeneric from "./messages/marking-overdue-generic";
import MarkingSubmitted from "./messages/marking-submitted";
import CoordinatorModeration from "./messages/moderation/coordinator";
import ReaderNegotiationOverdue from "./messages/negotation-overdue/reader";
import SupervisorNegotiationOverdue from "./messages/negotation-overdue/supervisor";
import NegotiationOverdueGeneric from "./messages/negotiation-overdue-generic";
import NegotiationResolved from "./messages/negotiation-resolved";
import CoordinatorNegotiation from "./messages/negotiation/coordinator";
import ReaderNegotiate1 from "./messages/negotiation/reader";
import SupervisorNegotiate1 from "./messages/negotiation/supervisor";

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

  public async notifyGenericMarkingOverdue({
    params,
    markers,
  }: {
    params: InstanceParams;
    markers: { email: string }[];
  }) {
    const message = <MarkingOverdueGeneric params={params} />;
    const subject = "Marking Overdue";

    await Promise.all(
      markers.flatMap((m) => [
        this.sendMail({ message, subject, to: [m.email] }),
        this.sendMail({
          message,
          subject: tag_coordinator(m.email + " " + subject),
          to: [PAUL_EMAIL],
        }),
      ]),
    );
  }

  public async notifyGenericNegotiationOverdue({
    markers,
  }: {
    markers: { email: string }[];
  }) {
    const message = <NegotiationOverdueGeneric />;
    const subject = "Negotiation Overdue";

    await Promise.all(
      markers.flatMap((m) => [
        this.sendMail({ message, subject, to: [m.email] }),
        this.sendMail({
          message,
          subject: tag_coordinator(m.email + " " + subject),
          to: [PAUL_EMAIL],
        }),
      ]),
    );
  }

  public async notifyMarkingSubmitted({
    project,
    student,
    unit,
    criteria,
    submission,
    marker,
  }: {
    project: ProjectDTO;
    student: StudentDTO;
    unit: UnitOfAssessmentDTO;
    criteria: AssessmentCriterionDTO[];
    submission: MarkingSubmissionDTO;
    marker: UserDTO;
  }) {
    const message = (
      <MarkingSubmitted
        project={project}
        student={student}
        unit={unit}
        criteria={criteria}
        submission={submission}
        marker={marker}
      />
    );

    const subject = "Marking Submitted";

    await Promise.all([
      this.sendMail({ message, subject, to: [marker.email] }),
      this.sendMail({
        message,
        subject: tag_coordinator(subject),
        to: [PAUL_EMAIL],
      }),
    ]);
  }

  public async notifyNegotiationOverdue({
    student,
    project,
    unit,
    supervisor,
    params,
    reader,
  }: {
    project: ProjectDTO;
    student: StudentDTO;
    unit: UnitOfAssessmentDTO;
    reader: ReaderDTO;
    supervisor: SupervisorDTO;
    params: InstanceParams;
  }) {
    const subject = "Negotiation Overdue";

    await Promise.all([
      this.sendMail({
        message: (
          <SupervisorNegotiationOverdue
            student={student}
            project={project}
            unit={unit}
            supervisor={supervisor}
            params={params}
          />
        ),
        to: [supervisor.email],
        subject,
      }),
      this.sendMail({
        message: (
          <ReaderNegotiationOverdue
            student={student}
            project={project}
            reader={reader}
          />
        ),
        to: [reader.email],
        subject,
      }),
    ]);
  }

  public async notifyNegotiationResolved({
    student,
    supervisor,
    reader,
    project,
    unit,
    grade,
  }: {
    student: StudentDTO;
    supervisor: SupervisorDTO;
    reader: ReaderDTO;
    project: ProjectDTO;
    unit: UnitOfAssessmentDTO;
    grade: string;
  }) {
    const message = (
      <NegotiationResolved
        student={student}
        grade={grade}
        project={project}
        unit={unit}
      />
    );
    const subject = "Grading Auto-resolve succeeded";

    await Promise.all([
      this.sendMail({ message, subject, to: [supervisor.email] }),
      this.sendMail({ message, subject, to: [supervisor.email] }),
      this.sendMail({ message, subject, to: [reader.email] }),
      this.sendMail({
        message,
        subject: tag_coordinator(subject),
        to: [PAUL_EMAIL],
      }),
    ]);
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
      this.sendMail({
        message,
        subject: tag_coordinator(subject),
        to: [PAUL_EMAIL],
      }),
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
        subject: tag_coordinator(subject),
        to: [PAUL_EMAIL],
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
        subject: tag_coordinator(subject),
        to: [PAUL_EMAIL],
      }),
    ]);
  }
}
