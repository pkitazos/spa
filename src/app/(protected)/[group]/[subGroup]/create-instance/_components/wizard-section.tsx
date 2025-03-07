"use client";
import { InstanceWizard } from "./instance-wizard";

export function WizardSection() {
  return (
    <InstanceWizard
      onSubmit={async (data: { displayName?: string }) => {}}
      onCancel={async () => {}}
    />
  );
}
