import { STAGES } from "@/config/stages";

import { Heading } from "@/components/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import Layout from "./layout";

export default async function AdminPanel({
  params,
}: {
  params: InstanceParams;
}) {
  const { displayName, stage } = await api.institution.instance.get({ params });
  const stageInfo = STAGES[stage];

  return (
    <Layout params={params}>
      <Heading>{displayName}</Heading>
      <Card className="grid h-full w-full place-items-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <span className="text-muted-foreground">Stage:</span>{" "}
              <span>
                {stageInfo.number} - {stageInfo.displayName}
              </span>
            </p>
            <p>
              <span>{stageInfo.description}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
