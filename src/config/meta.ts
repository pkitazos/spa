export const app = {
  name: "SPA",
  institution: { name: "UofG" },
  metadata: { separator: " - " },
  descriptor: "allocation & marking project system",
};

export function metadataTitle(segments: string[]) {
  return segments.join(app.metadata.separator);
}
