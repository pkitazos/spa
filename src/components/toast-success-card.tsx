import { type ReactNode } from "react";

export function ToastSuccessCard({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-start gap-2">
      <div className="flex h-6 w-6 items-center justify-start">
        <SuccessIcon />
      </div>
      <p className="font-medium">{message} </p>
      {action}
    </div>
  );
}

function SuccessIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      height="20"
      width="20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}
