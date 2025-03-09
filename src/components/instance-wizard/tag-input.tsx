"use client";

import { useState, type KeyboardEvent } from "react";
import { X, Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { WizardFormData } from "./instance-wizard";

interface TagInputProps {
  label?: string;
  description?: string;
  placeholder?: string;
}

export default function TagInput({
  label,
  description,
  placeholder,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const form = useFormContext<WizardFormData>();

  const focusInput = () => {
    form.setFocus("tags");
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="tag-input">{label}</Label>}
      {description && (
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      )}

      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => {
          const handleAddTag = () => {
            if (
              inputValue.trim() !== "" &&
              !field.value.map((t) => t.title).includes(inputValue.trim())
            ) {
              const newTags = [...field.value, { title: inputValue.trim() }];
              field.onChange(newTags);
              console.log(form.formState.errors);

              setInputValue("");
            }
          };

          const handleRemoveTag = (tagToRemove: string) => {
            const newTags = field.value.filter((t) => t.title !== tagToRemove);
            field.onChange(newTags);
          };

          const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            } else if (
              e.key === "Backspace" &&
              inputValue === "" &&
              field.value.length > 0
            ) {
              const newTags = [...field.value];
              newTags.pop();
              field.onChange(newTags);
            }
          };

          return (
            <FormItem
              onClick={focusInput}
              className="flex flex-col rounded-md border bg-background p-2 focus-within:ring-1 focus-within:ring-ring"
            >
              <div className="mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    id="tag-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </FormControl>
                <FormMessage />

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
                className={cn("w-full", field.value.length > 0 && "h-[200px]")}
              >
                <div className="flex flex-wrap gap-2">
                  {field.value.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="px-3 py-1.5 text-sm font-normal"
                    >
                      {tag.title}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTag(tag.title)}
                        className="ml-1 h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {tag.title}</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </FormItem>
          );
        }}
      />
    </div>
  );
}
