import React from "react";

import { cn } from "@/lib/utils";

import { Tag, type TagProps } from "./tag";
import { type TagType } from "./tag-input";

export type TagListProps = {
  tags: TagType[];
  customTagRenderer?: (tag: TagType) => React.ReactNode;
  direction?: TagProps["direction"];
} & Omit<TagProps, "tagObj">;

export function TagList({
  tags,
  customTagRenderer,
  direction,
  ...tagListProps
}: TagListProps) {
  return (
    <div
      className={cn("max-w-[450px] rounded-md", {
        "flex flex-wrap gap-2": direction === "row",
        "flex flex-col gap-2": direction === "column",
      })}
    >
      {tags.map((tagObj) =>
        customTagRenderer ? (
          customTagRenderer(tagObj)
        ) : (
          <Tag key={tagObj.id} tagObj={tagObj} {...tagListProps} />
        ),
      )}
    </div>
  );
}
