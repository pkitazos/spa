import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.marking.byProjectMarkingSummary({ params });

  return (
    <section className="pt-6">
      {/* <MarkingOverviewTable data={data} /> */}
      <div>TODO</div>
    </section>
  );
}
