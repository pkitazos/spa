export const app = {
  name: "AMPS",
  institution: { name: "UofG" },
  metadata: { separator: " - " },
  descriptor: "SoCS allocation & marking project system",
  supportMail: "compsci-spa-support@glasgow.ac.uk",
};

export function metadataTitle(segments: string[]) {
  return segments.join(app.metadata.separator);
}
