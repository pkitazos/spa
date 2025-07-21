"use client";

import { ConstructionIcon } from "lucide-react";

import { app } from "@/config/meta";

import { CopyButton } from "@/components/copy-button";
import { PanelWrapper } from "@/components/panel-wrapper";

export default function Page() {
  return (
    <PanelWrapper className="pt-4 flex items-center justify-center h-dvh w-full">
      <div className="mx-auto max-w-xl text-center flex flex-col items-center w-full">
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
        <p className="mt-4 w-full text-muted-foreground text-center">
          If you think you should be able to see the app, contact support
          at{" "}
        </p>
        <code className="flex text-secondary items-center gap-1.5">
          {app.supportEmail}
          <CopyButton data={app.supportEmail} message="support email" />
        </code>
      </div>
    </PanelWrapper>
  );
}
