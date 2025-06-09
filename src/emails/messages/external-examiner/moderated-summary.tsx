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
  fakeThirdMarkerDissertationSubmission,
  fakeDissertationCriteria,
  fakeConductCriteria,
} from "@/emails/fake-data";
import { Grade } from "@/config/grades";
import { Marksheet } from "@/emails/components/marksheet";

export interface ModeratedSummaryProps {
  student: StudentDTO;
  project: ProjectDTO;
  reader: ReaderDTO;
  supervisor: SupervisorDTO;
  // thirdMarker: UserDTO;

  presentationCriteria: AssessmentCriterionDTO[];
  conductCriteria: AssessmentCriterionDTO[];
  dissertationCriteria: AssessmentCriterionDTO[];

  supervisorConductSubmission: MarkingSubmissionDTO;
  supervisorPresentationSubmission: MarkingSubmissionDTO;
  supervisorDissertationSubmission: MarkingSubmissionDTO;
  readerDissertationSubmission: MarkingSubmissionDTO;
  thirdMarkerDissertationSubmission: MarkingSubmissionDTO;
  finalMark: number;
}

export function ModeratedSummary({
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
  thirdMarkerDissertationSubmission,
  finalMark,
}: ModeratedSummaryProps) {
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
        {/* <Row>
          <Column>
            <Text className="my-0">Third Marker:</Text>
          </Column>
          <Column className="text-right">
            <Text className="my-0">
              {thirdMarker.name} ({thirdMarker.email})
            </Text>
          </Column>
        </Row> */}
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
        <Heading
          as="h3"
          className="underline decoration-blue-700 decoration-[2.5px]"
        >
          {" "}
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
        <Heading
          as="h3"
          className="underline decoration-blue-700 decoration-[2.5px]"
        >
          {" "}
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
            <Text className="my-0 text-xl font-semibold text-blue-700">
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
            <Text className="my-0 text-xl font-semibold text-blue-700">
              {Grade.toLetter(thirdMarkerDissertationSubmission.grade)}
            </Text>
          </Column>
        </Row>
        <Marksheet
          criteria={dissertationCriteria}
          submission={thirdMarkerDissertationSubmission}
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
              {Grade.toLetter(finalMark)}
            </Text>
          </Column>
        </Row>
      </Section>
    </PDFLayout>
  );
}

ModeratedSummary.PreviewProps = {
  student: fakeStudent,
  project: fakeProject,
  supervisor: fakeSupervisor,
  reader: fakeReader,
  // thirdMarker: fakeThirdMarker,

  conductCriteria: fakeConductCriteria,
  presentationCriteria: fakeCriteria,
  dissertationCriteria: fakeDissertationCriteria,

  supervisorConductSubmission: fakeSupervisorConductSubmission,
  supervisorPresentationSubmission: fakeSupervisorPresentationSubmission,
  supervisorDissertationSubmission: fakeSupervisorDissertationSubmission,
  readerDissertationSubmission: fakeReaderDissertationSubmission,
  thirdMarkerDissertationSubmission: fakeThirdMarkerDissertationSubmission,
  finalMark: 20,
} satisfies ModeratedSummaryProps;

export default ModeratedSummary;
