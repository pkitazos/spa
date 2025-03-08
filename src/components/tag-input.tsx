"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { X, Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagInputProps {
  label?: string;
  description?: string;
  placeholder?: string;
  defaultTags?: string[];
  maxHeight?: number;
  onChange?: (tags: string[]) => void;
}

export default function TagInput({
  label,
  description,
  placeholder,
  defaultTags = [],
  maxHeight = 200,
  onChange,
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (inputValue.trim() !== "" && !tags.includes(inputValue.trim())) {
      const newTags = [...tags, inputValue.trim()];
      setTags(newTags);
      onChange?.(newTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    onChange?.(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      const newTags = [...tags];
      newTags.pop();
      setTags(newTags);
      onChange?.(newTags);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="tag-input">{label}</Label>}
      {description && (
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      )}

      <div
        onClick={focusInput}
        className="rounded-md border bg-background p-2 focus-within:ring-1 focus-within:ring-ring"
      >
        <div className="mb-2 flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="tag-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddTag}
            disabled={inputValue.trim() === ""}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add tag</span>
          </Button>
        </div>

        <ScrollArea
          className={`w-full ${tags.length > 0 ? `max-h-[${maxHeight}px]` : ""}`}
        >
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-3 py-1.5 text-sm font-normal"
              >
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </Button>
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
