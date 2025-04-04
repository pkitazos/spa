import { PageParams } from "@/lib/validations/params";
import { GradesTable } from "./_components/grades-table";
import { api } from "@/lib/trpc/server";
import { Grade } from "@/config/grades";

export default async function Page({ params }: { params: PageParams }) {
  const data = await api.institution.instance.getMarkerSubmissions({
    params,
    unitOfAssessmentId: params.id,
  });

  return (
    <main className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">
        {params.id}
        {/* {flag} - {unit} */}
      </h1>
      {/* copy emails section based on filter */}
      <GradesTable
        data={data.map((x) => {
          const { status, grade } = Grade.autoResolve(
            x.supervisorGrade,
            x.readerGrade,
          );

          return {
            project: x.project,
            student: x.student,
            supervisor: x.supervisor,
            supervisorGrade: x.supervisorGrade,
            reader: x.reader,
            readerGrade: x.readerGrade,
            computedOverall: grade,
            status,
            action: "action",
          };
        })}
      />
    </main>
  );
}
