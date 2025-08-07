import { CopyButton } from "./copy-button";

export function CodeSnippet({
  label,
  code,
  copyMessage,
}: {
  label: string;
  code: string;
  copyMessage?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="relative group">
        <div className="flex items-center justify-between bg-muted/50 border rounded-lg p-3">
          <code className="text-sm font-mono text-foreground flex-1 pr-2 break-all">
            {code}
          </code>
          <CopyButton
            data={code}
            message={copyMessage}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
