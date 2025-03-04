export const app = {
  name: "SPA",
  institution: { name: "UofG" },
  metadata: {
    separator: " - ",
  },
};

export function metadataTitle(segments: string[]) {
  return segments.join(app.metadata.separator);
}
