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
  fakeSupervisorPresentationSubmission,
  fakeSupervisorDissertationSubmission,
  fakeThirdMarker,
  fakeThirdMarkerDissertationSubmission,
  fakeDissertationCriteria,
  fakeConductCriteria,
} from "@/emails/fake-data";
import { ThirdMarkerComments } from "@/emails/components/pdf/third-marker-comments";
import { Grade } from "@/config/grades";
import { Marksheet } from "@/emails/components/marksheet";

interface Props {
  student: StudentDTO;
  project: ProjectDTO;
  reader: ReaderDTO;
  supervisor: SupervisorDTO;
  thirdMarker: ReaderDTO;

  presentationCriteria: AssessmentCriterionDTO[];
  conductCriteria: AssessmentCriterionDTO[];
  dissertationCriteria: AssessmentCriterionDTO[];

  supervisorConductSubmission: MarkingSubmissionDTO;
  supervisorPresentationSubmission: MarkingSubmissionDTO;
  supervisorDissertationSubmission: MarkingSubmissionDTO;
  readerDissertationSubmission: MarkingSubmissionDTO;
  thirdMarkerDissertationSubmission: MarkingSubmissionDTO;
}

export function ModeratedSummary({
  student,
  project,

  supervisor,
  reader,
  thirdMarker,

  presentationCriteria,
  conductCriteria,
  dissertationCriteria,

  supervisorConductSubmission,
  supervisorPresentationSubmission,
  supervisorDissertationSubmission,
  readerDissertationSubmission,
  thirdMarkerDissertationSubmission,
}: Props) {
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
        <Row>
          <Column>
            <Text className="my-0">Third Marker:</Text>
          </Column>
          <Column className="text-right">
            <Text className="my-0">
              {thirdMarker.name} ({thirdMarker.email})
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr />

      <Section>
        <Heading as="h3" className="underline decoration-sky-600">
          Conduct:
        </Heading>
        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Supervisor Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-800">
              {Grade.toLetter(supervisorConductSubmission.grade)}
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
        <Heading as="h3" className="underline decoration-sky-600">
          Presentation:
        </Heading>
        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Supervisor Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-800">
              {Grade.toLetter(supervisorPresentationSubmission.grade)}
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
        <Heading as="h3" className="underline decoration-sky-600">
          Dissertation:
        </Heading>
        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Supervisor Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-800">
              {Grade.toLetter(supervisorDissertationSubmission.grade)}
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
            <Text className="my-0 text-xl font-semibold text-blue-800">
              {Grade.toLetter(readerDissertationSubmission.grade)}
            </Text>
          </Column>
        </Row>
        <Marksheet
          criteria={dissertationCriteria}
          submission={readerDissertationSubmission}
        />

        <Row>
          <Column>
            <Heading as="h4" className="my-0">
              Third Marker Grade
            </Heading>
          </Column>
          <Column className="text-right">
            <Text className="my-0 text-xl font-semibold text-blue-800">
              {Grade.toLetter(thirdMarkerDissertationSubmission.grade)}
            </Text>
          </Column>
        </Row>
        <ThirdMarkerComments
          comments={thirdMarkerDissertationSubmission.finalComment}
        />
      </Section>
    </PDFLayout>
  );
}

ModeratedSummary.PreviewProps = {
  student: fakeStudent,
  project: fakeProject,
  supervisor: fakeSupervisor,
  reader: fakeReader,
  thirdMarker: fakeThirdMarker,

  conductCriteria: fakeConductCriteria,
  presentationCriteria: fakeCriteria,
  dissertationCriteria: fakeDissertationCriteria,

  supervisorConductSubmission: fakeSupervisorConductSubmission,
  supervisorPresentationSubmission: fakeSupervisorPresentationSubmission,
  supervisorDissertationSubmission: fakeSupervisorDissertationSubmission,
  readerDissertationSubmission: fakeReaderDissertationSubmission,
  thirdMarkerDissertationSubmission: fakeThirdMarkerDissertationSubmission,
} satisfies Props;

export default ModeratedSummary;
