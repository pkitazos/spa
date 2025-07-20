import { ConstructionIcon } from "lucide-react";

import { app } from "@/config/meta";

import { PanelWrapper } from "@/components/panel-wrapper";

export default async function Page() {
  return (
    <PanelWrapper className="pt-4 flex items-center justify-center h-dvh">
      <div className="mx-auto max-w-md text-center">
        <ConstructionIcon className="w-20 h-20 text-yellow-400 mx-auto" />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          We&apos;re currently in testing!
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Thank you for visiting {app.name}.
        </p>
        <p className="mt-4 text-lg text-muted-foreground">
          We&apos;re working hard to make improvements to our platform. Please
          check back later!
        </p>
      </div>
    </PanelWrapper>
  );
}
