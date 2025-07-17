import type z from "zod";

export function CSVParsingErrorCard({
  title,
  errors,
  getError = (error) => error.message,
}: {
  title: string;
  errors: z.core.$ZodIssue[];
  getError?: (error: z.core.$ZodIssue) => string;
}) {
  const uniqueErrors = [...new Set(errors.map(getError))];
  return (
    <p>
      <p className="font-semibold">{title}</p>
      <ul className="list-disc pl-4">
        {uniqueErrors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </p>
  );
}
