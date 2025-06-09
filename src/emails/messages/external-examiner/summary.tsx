import {
  AssessmentCriterionDTO,
  MarkingSubmissionDTO,
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  SupervisorDTO,
} from "@/dto";
import {
  Column,
  Heading,
  Row,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import { PDFLayout } from "../../components/pdf/layout";
import {
  fakeCriteria,
  fakeProject,
  fakeReader,
  fakeReaderDissertationSubmission,
  fakeStudent,
  fakeSupervisor,
  fakeSupervisorConductSubmission,
  fakeSupervisorDissertationSubmission,
  fakeDissertationCriteria,
  fakeConductCriteria,
  fakeSupervisorMissingPresentationSubmission,
} from "@/emails/fake-data";
import { Grade } from "@/config/grades";
import { Marksheet } from "@/emails/components/marksheet";

export interface SummaryProps {
  student: StudentDTO;
  project: ProjectDTO;
  reader: ReaderDTO;
  supervisor: SupervisorDTO;

  presentationCriteria: AssessmentCriterionDTO[];
  conductCriteria: AssessmentCriterionDTO[];
  dissertationCriteria: AssessmentCriterionDTO[];

  supervisorConductSubmission: MarkingSubmissionDTO;
  supervisorPresentationSubmission: MarkingSubmissionDTO;
  supervisorDissertationSubmission: MarkingSubmissionDTO;
  readerDissertationSubmission: MarkingSubmissionDTO;
  finalMark: number;
}

export function Summary({
  student,
  project,
  supervisor,
  reader,

  presentationCriteria,
  conductCriteria,
  dissertationCriteria,

  supervisorConductSubmission,
  supervisorPresentationSubmission,
  supervisorDissertationSubmission,
  readerDissertationSubmission,
  finalMark,
}: SummaryProps) {
  return (
    <PDFLayout>
      <Section>
        <Heading as="h2">Student Project Summary</Heading>
        <Row>
          <Column>
            <Text className="my-0">Student:</Text>
          </Column>
          <Column className="text-right">
            <Text className="my-0">
              {student.name} ({student.id})
            </Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text className="my-0">Project:</Text>
          </Column>
          <Column className="text-right">
            <Text className="my-0">{project.title}</Text>
          </Column>
        </Row>

        <Row className="mt-6">
          <Column>
            <Text className="my-0">Supervisor:</Text>
          </Column>
          <Column className="text-right">
            <Text className="my-0">
              {supervisor.name} ({supervisor.email})
            </Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="my-0">Reader:</Text>
          </Column>
          <Column className="text-right">
            <Text className="my-0">
              {reader.name} ({reader.email})
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr />

      <Section>
        <Heading
          as="h3"
          className="underline decoration-blue-700 decoration-[2.5px]"
        >
          Conduct:
        </Heading>
        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Supervisor Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-700">
              {supervisorConductSubmission.grade === -2
                ? "No Submission"
                : Grade.toLetter(supervisorConductSubmission.grade)}
            </Text>
          </Column>
        </Row>
        <Marksheet
          criteria={conductCriteria}
          submission={supervisorConductSubmission}
        />
      </Section>

      <Hr />

      <Section>
        <Heading
          as="h3"
          className="underline decoration-blue-700 decoration-[2.5px]"
        >
          Presentation:
        </Heading>
        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Supervisor Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-700">
              {supervisorPresentationSubmission.grade === -2
                ? "No Submission"
                : Grade.toLetter(supervisorPresentationSubmission.grade)}
            </Text>
          </Column>
        </Row>
        <Marksheet
          criteria={presentationCriteria}
          submission={supervisorPresentationSubmission}
        />
      </Section>

      <Hr />

      <Section>
        <Heading
          as="h3"
          className="underline decoration-blue-700 decoration-[2.5px]"
        >
          Dissertation:
        </Heading>
        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Supervisor Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-700">
              {supervisorDissertationSubmission.grade === -2
                ? "No Submission"
                : Grade.toLetter(supervisorDissertationSubmission.grade)}
            </Text>
          </Column>
        </Row>
        <Marksheet
          criteria={dissertationCriteria}
          submission={supervisorDissertationSubmission}
        />

        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Reader Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-700">
              {readerDissertationSubmission.grade === -2
                ? "No Submission"
                : Grade.toLetter(readerDissertationSubmission.grade)}
            </Text>
          </Column>
        </Row>
        <Marksheet
          criteria={dissertationCriteria}
          submission={readerDissertationSubmission}
        />
      </Section>

      <Section>
        <Row>
          <Column>
            <Heading
              as="h3"
              className="underline decoration-blue-700 decoration-[2.5px]"
            >
              Final Mark:
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-700">
              {finalMark === -2 ? "No Submission" : Grade.toLetter(finalMark)}
            </Text>
          </Column>
        </Row>
      </Section>
    </PDFLayout>
  );
}

Summary.PreviewProps = {
  student: fakeStudent,
  project: fakeProject,
  supervisor: fakeSupervisor,
  reader: fakeReader,

  conductCriteria: fakeConductCriteria,
  presentationCriteria: fakeCriteria,
  dissertationCriteria: fakeDissertationCriteria,

  supervisorConductSubmission: fakeSupervisorConductSubmission,
  supervisorPresentationSubmission: fakeSupervisorMissingPresentationSubmission,
  supervisorDissertationSubmission: fakeSupervisorDissertationSubmission,
  readerDissertationSubmission: fakeReaderDissertationSubmission,
  finalMark: 20,
} satisfies SummaryProps;

export default Summary;
