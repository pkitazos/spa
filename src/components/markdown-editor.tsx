"use client";

import { type JSX } from "react";

import MDEditor, { type MDEditorProps } from "@uiw/react-md-editor";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkMath from "remark-math";

export function MarkdownEditor(props: JSX.IntrinsicAttributes & MDEditorProps) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
      />
      <MDEditor
        {...props}
        commands={[]}
        previewOptions={{
          className: "prose prose-ol:list-decimal",
          remarkPlugins: [[remarkMath]],
          rehypePlugins: [[rehypeSanitize], [rehypeKatex]],
        }}
      />
    </>
  );
}

export function MarkdownRenderer({ source }: { source: string }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
      />
      <MDEditor.Markdown
        className="prose prose-ol:list-decimal"
        source={source}
        remarkPlugins={[[remarkMath]]}
        rehypePlugins={[[rehypeSanitize], [rehypeKatex]]}
      />
    </>
  );
}
