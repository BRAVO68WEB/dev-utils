"use client";

import { keymap } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import type { Extension } from "@codemirror/state";
import { editorChrome, editorSyntax } from "@/lib/editor/setup";
import { languageExtension } from "@/lib/editor/languages";
import { useResolvedTheme } from "@/components/shell/use-theme";
import { newId } from "@/lib/types";

const modEnter = new Map<string, (() => void) | undefined>();

export function CodeEditor({
  value,
  onChange,
  language = "plain",
  readOnly = false,
  height = "100%",
  extraExtensions = [],
  caret = null,
  onModEnter,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  extraExtensions?: Extension[];
  caret?: { from: number; to: number; nonce: number } | null;
  onModEnter?: () => void;
}) {
  const dark = useResolvedTheme() === "dark";
  const ref = useRef<ReactCodeMirrorRef>(null);
  const [editorId] = useState(newId);

  useEffect(() => {
    modEnter.set(editorId, onModEnter);
    return () => {
      modEnter.delete(editorId);
    };
  });

  useEffect(() => {
    const view = ref.current?.view;
    if (!view || !caret) return;
    view.dispatch({
      selection: { anchor: caret.from, head: caret.to },
      scrollIntoView: true,
    });
    view.focus();
  }, [caret]);

  const extensions = [
    ...languageExtension(language),
    editorSyntax(),
    ...extraExtensions,
    keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          const handler = modEnter.get(editorId);
          handler?.();
          return Boolean(handler);
        },
      },
    ]),
  ];

  return (
    <CodeMirror
      ref={ref}
      value={value}
      height={height}
      theme={editorChrome(dark)}
      extensions={extensions}
      editable={!readOnly}
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
      onChange={(next: string) => onChange?.(next)}
      className="h-full min-h-0 overflow-auto text-[13px]"
    />
  );
}
