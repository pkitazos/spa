import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

export default async function Page({ params }: { params: InstanceParams }) {
  const hello = await api.institution.instance.getAllUnitsOfAssessment({
    params,
  });

  return (
    <>
      {hello.map((x) => (
        <p>{x.title}</p>
      ))}
    </>
  );
}
