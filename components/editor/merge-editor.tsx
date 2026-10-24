"use client";

import { useEffect, useRef } from "react";
import { Change, getOriginalDoc, MergeView, originalDocChangeEffect, unifiedMergeView } from "@codemirror/merge";
import { ChangeSet, EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useResolvedTheme } from "@/components/shell/use-theme";
import { editorChrome, editorExtensions } from "@/lib/editor/setup";
import { languageExtension } from "@/lib/editor/languages";
import { summarizeDiff } from "@/lib/text/diff";
import type { DiffState } from "@/lib/types";

export function MergeEditor({
  left,
  right,
  language,
  ignoreWhitespace,
  view,
  onChange,
}: {
  left: string;
  right: string;
  language: DiffState["language"];
  ignoreWhitespace: boolean;
  view: DiffState["view"];
  onChange: (next: { left: string; right: string }) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const latest = useRef({ left, right });
  const splitRef = useRef<MergeView | null>(null);
  const unifiedRef = useRef<EditorView | null>(null);
  const syncing = useRef(false);
  const dark = useResolvedTheme() === "dark";

  useEffect(() => {
    onChangeRef.current = onChange;
    latest.current = { left, right };
  });

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;
    parent.replaceChildren();
    const start = latest.current;
    const lang = languageExtension(language);
    const diffConfig = {
      override: (before: string, after: string) =>
        summarizeDiff(before, after, ignoreWhitespace).changes.map(
          (change) => new Change(change.fromA, change.toA, change.fromB, change.toB),
        ),
    };
    let read = () => ({ left: start.left, right: start.right });
    const listener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !syncing.current) onChangeRef.current(read());
    });
    const extensions = [...editorExtensions(lang), editorChrome(dark), listener];

    if (view === "split") {
      const merge = new MergeView({
        parent,
        a: { doc: start.left, extensions },
        b: { doc: start.right, extensions },
        highlightChanges: true,
        gutter: true,
        diffConfig,
      });
      read = () => ({ left: merge.a.state.doc.toString(), right: merge.b.state.doc.toString() });
      splitRef.current = merge;
      unifiedRef.current = null;
      return () => {
        merge.destroy();
        splitRef.current = null;
      };
    }

    const unified = new EditorView({
      parent,
      state: EditorState.create({
        doc: start.right,
        extensions: [
          ...extensions,
          unifiedMergeView({
            original: start.left,
            highlightChanges: true,
            gutter: true,
            mergeControls: false,
            diffConfig,
          }),
        ],
      }),
    });
    read = () => ({ left: getOriginalDoc(unified.state).toString(), right: unified.state.doc.toString() });
    unifiedRef.current = unified;
    splitRef.current = null;
    return () => {
      unified.destroy();
      unifiedRef.current = null;
    };
  }, [dark, ignoreWhitespace, language, view]);

  useEffect(() => {
    const merge = splitRef.current;
    if (!merge) return;
    replaceDoc(merge.a, left, syncing);
    replaceDoc(merge.b, right, syncing);
  }, [left, right]);

  useEffect(() => {
    const unified = unifiedRef.current;
    if (!unified) return;
    const original = getOriginalDoc(unified.state).toString();
    if (original !== left) {
      syncing.current = true;
      const changes = ChangeSet.of([{ from: 0, to: getOriginalDoc(unified.state).length, insert: left }], getOriginalDoc(unified.state).length);
      unified.dispatch({ effects: originalDocChangeEffect(unified.state, changes) });
      syncing.current = false;
    }
    replaceDoc(unified, right, syncing);
  }, [left, right]);

  return <div ref={parentRef} className="h-full min-h-0" />;
}

function replaceDoc(view: EditorView, next: string, syncing: { current: boolean }) {
  const current = view.state.doc.toString();
  if (current === next) return;
  syncing.current = true;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: next },
    selection: EditorSelection.cursor(Math.min(view.state.selection.main.head, next.length)),
  });
  syncing.current = false;
}
