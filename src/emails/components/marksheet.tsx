import { Grade } from "@/config/grades";
import { AssessmentCriterionDTO, MarkingSubmissionDTO } from "@/dto";
import { FormatPercent } from "@/lib/utils/format-percent";
import { Text, Section, Row } from "@react-email/components";

export function Marksheet({
  submission,
  criteria,
}: {
  submission: MarkingSubmissionDTO;
  criteria: AssessmentCriterionDTO[];
}) {
  const totalWeight = criteria.reduce((acc, val) => acc + val.weight, 0);

  return (
    <>
      {criteria.map((c) => {
        const grade = submission.marks[c.id];
        return (
          <Section>
            <Row className="flex flex-row">
              <span>
                <h4 className="mb-0 inline-block">
                  {c.title} (weight {FormatPercent(c.weight / totalWeight)}
                  ):{" "}
                </h4>
                <i>{Grade.toLetter(grade.mark)}</i>
              </span>
            </Row>

            <Text>{grade.justification}</Text>
          </Section>
        );
      })}
      <Section>
        <Row className="flex flex-row">
          <span>
            <h4 className="mb-0 inline-block">Overall: </h4>
            <i>{Grade.toLetter(submission.grade)}</i>
          </span>
        </Row>

        <Text>{submission.finalComment}</Text>
      </Section>
    </>
  );
}
