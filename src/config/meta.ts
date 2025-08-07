export const app = {
  name: "SPA",
  fullName: "Student Project Allocation & Marking System",
  institution: { name: "UofG" },
  metadata: { separator: " - " },
  descriptor: "SoCS project allocation & marking system",
  supportEmail: "compsci-spa-support@glasgow.ac.uk",
};

export function metadataTitle(segments: string[]) {
  return segments.join(app.metadata.separator);
}
