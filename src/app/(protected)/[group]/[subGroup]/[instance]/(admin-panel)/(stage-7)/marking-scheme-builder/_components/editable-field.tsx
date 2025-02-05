"use client";

import { useEffect, useState } from "react";

import { useDebounce } from "../_hooks/use-debounce";
import { PenIcon } from "lucide-react";

export function EditableField({
  initialValue,
  children,
  onSave,
}: {
  initialValue: string;
  children: React.ReactNode;
  onSave: (value: string) => void;
}) {
  const [editable, setEditable] = useState(false);
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (debouncedValue !== initialValue) {
      onSave(debouncedValue);
    }
  }, [debouncedValue, initialValue, onSave]);

  return (
    <button
      className="flex items-center gap-3 "
      onClick={() => console.log("edit title")}
    >
      {editable ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded border p-1"
        />
      ) : (
        <>
          {children}
          <PenIcon className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
