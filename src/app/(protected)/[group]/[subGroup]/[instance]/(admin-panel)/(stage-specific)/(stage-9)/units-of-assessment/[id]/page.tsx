import { PageParams } from "@/lib/validations/params";
import { GradesTable } from "./_components/grades-table";
import { api } from "@/lib/trpc/server";

export default async function Page({ params }: { params: PageParams }) {
  const data = await api.institution.instance.getMarkerSubmissions({
    params,
    gradedSubmissionId: params.id,
  });

  return (
    <main className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">{params.id}</h1>
      <GradesTable
        data={data.map((x) => ({
          project: x.project,
          student: x.student,
          supervisor: x.supervisor,
          supervisorGrade: x.supervisorGrade,
          reader: x.reader,
          readerGrade: x.readerGrade,
          status: false,
          computedOverall: "Hello",
          action: "action",
        }))}
      />
    </main>
  );
}
