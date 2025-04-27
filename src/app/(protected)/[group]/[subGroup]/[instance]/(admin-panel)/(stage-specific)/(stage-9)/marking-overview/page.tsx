import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";
import { MarkingOverviewTable } from "./marking-overview-table";

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.marking.byProjectMarkingSummary({ params });

  return (
    <section className="pt-6">
      <MarkingOverviewTable data={data} />
    </section>
  );
}
