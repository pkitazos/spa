"use client";

import React from "react";

import { type VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { z } from "zod";

import { CommandInput } from "@/components/ui/command";

import { Autocomplete } from "./autocomplete";
import { type tagVariants } from "./tag";
import { TagList } from "./tag-list";

export enum Delimiter {
  Comma = ",",
  Enter = "Enter",
  Space = " ",
}

type OmittedInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "value"
>;
export const tagTypeSchema = z.object({ id: z.string(), title: z.string() });
export type TagType = z.infer<typeof tagTypeSchema>;

export interface TagInputProps
  extends OmittedInputProps,
    VariantProps<typeof tagVariants> {
  placeholder?: string;
  tags: TagType[];
  setTags: React.Dispatch<React.SetStateAction<TagType[]>>;
  autocompleteOptions: TagType[];
  readOnly?: boolean;
  disabled?: boolean;
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  allowDuplicates?: boolean;
  validateTag?: (tag: string) => boolean;
  delimiter?: Delimiter;
  showCount?: boolean;
  placeholderWhenFull?: string;
  sortTags?: boolean;
  delimiterList?: string[];
  truncate?: number;
  minLength?: number;
  maxLength?: number;
  value?: string | number | readonly string[] | { id: string; title: string }[];
  autocompleteFilter?: (option: string) => boolean;
  direction?: "row" | "column";
  onInputChange?: (value: string) => void;
  customTagRenderer?: (tag: TagType) => React.ReactNode;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onTagClick?: (tag: TagType) => void;
  inputFieldPosition?: "bottom" | "top" | "inline";
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>((props) => {
  const {
    placeholder,
    tags,
    setTags,
    variant,
    size,
    shape,
    autocompleteOptions,
    delimiter = Delimiter.Comma,
    onTagAdd,
    onTagRemove,
    validateTag,
    sortTags,
    delimiterList,
    truncate,
    autocompleteFilter,
    borderStyle,
    textCase,
    interaction,
    animation,
    textStyle,
    minLength,
    maxLength,
    direction = "row",
    onInputChange,
    customTagRenderer,
    onFocus,
    onBlur,
    onTagClick,
    inputFieldPosition = "bottom",
  } = props;

  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      delimiterList
        ? delimiterList.includes(e.key)
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
          e.key === delimiter || e.key === Delimiter.Enter
    ) {
      e.preventDefault();
      const newTagText = inputValue.trim();

      if (validateTag && !validateTag(newTagText)) {
        return;
      }

      if (minLength && newTagText.length < minLength) {
        toast.error("Tag is too short");
        return;
      }

      if (maxLength && newTagText.length > maxLength) {
        toast.error("Tag is too long");
        return;
      }

      const newTagId = uuid();

      if (newTagText && !tags.some((tag) => tag.title === newTagText)) {
        setTags([...tags, { id: newTagId, title: newTagText }]);
        onTagAdd?.(newTagText);
      }
      setInputValue("");
    }
  };

  const removeTag = (idToRemove: string) => {
    setTags(tags.filter((tag) => tag.id !== idToRemove));
    onTagRemove?.(tags.find((tag) => tag.id === idToRemove)?.title ?? "");
  };

  const filteredAutocompleteOptions = autocompleteFilter
    ? autocompleteOptions?.filter((option) => autocompleteFilter(option.title))
    : autocompleteOptions;

  const displayedTags = sortTags ? [...tags].sort() : tags;

  const truncatedTags = truncate
    ? tags.map((tag) => ({
        id: tag.id,
        title:
          tag.title?.length > truncate
            ? `${tag.title.substring(0, truncate)}...`
            : tag.title,
      }))
    : displayedTags;

  return (
    <div
      className={`flex w-full gap-3 ${
        inputFieldPosition === "bottom"
          ? "flex-col"
          : inputFieldPosition === "top"
            ? "flex-col-reverse"
            : "flex-row"
      }`}
    >
      <TagList
        tags={truncatedTags}
        customTagRenderer={customTagRenderer}
        variant={variant}
        size={size}
        shape={shape}
        borderStyle={borderStyle}
        textCase={textCase}
        interaction={interaction}
        animation={animation}
        textStyle={textStyle}
        onTagClick={onTagClick}
        onRemoveTag={removeTag}
        direction={direction}
      />

      <div className="w-full max-w-[450px]">
        <Autocomplete
          tags={tags}
          setTags={setTags}
          autocompleteOptions={filteredAutocompleteOptions}
          onTagAdd={onTagAdd}
        >
          <CommandInput
            placeholder={placeholder}
            ref={inputRef}
            value={inputValue}
            onChangeCapture={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            className="w-full"
          />
        </Autocomplete>
      </div>
    </div>
  );
});

TagInput.displayName = "TagInput";

export { TagInput };
