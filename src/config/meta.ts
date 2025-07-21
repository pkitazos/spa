export const app = {
  name: "AMPS",
  fullName: "Allocation & Marking Project System",
  institution: { name: "UofG" },
  metadata: { separator: " - " },
  descriptor: "SoCS allocation & marking project system",
  supportEmail: "compsci-spa-support@glasgow.ac.uk",
};

export function metadataTitle(segments: string[]) {
  return segments.join(app.metadata.separator);
}
