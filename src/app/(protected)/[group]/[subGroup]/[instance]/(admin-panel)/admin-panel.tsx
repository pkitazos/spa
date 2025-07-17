import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import Layout from "./layout";

export default async function AdminPanel({
  params,
}: {
  params: InstanceParams;
}) {
  const instance = await api.institution.instance.get({ params });
  // TODO use parallel routes for home page
  return (
    <Layout params={params}>
      <div className="grid h-full w-full place-items-center">
        <p>
          This instance is in stage:{" "}
          <span className="font-bold">{instance.stage}</span>
        </p>
      </div>
    </Layout>
  );
}
