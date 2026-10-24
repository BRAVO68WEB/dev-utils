import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { tags } from "@lezer/highlight";
import { bracketMatching, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { type Extension } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";

const draculaHighlight = HighlightStyle.define([
  { tag: [tags.comment, tags.meta, tags.docComment], color: "var(--syn-comment)", fontStyle: "italic" },
  { tag: [tags.keyword, tags.operator, tags.modifier, tags.controlKeyword], color: "var(--syn-keyword)" },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: "var(--syn-string)" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--syn-number)" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.labelName], color: "var(--syn-function)" },
  { tag: [tags.typeName, tags.className, tags.namespace, tags.definition(tags.typeName)], color: "var(--syn-type)" },
  { tag: [tags.propertyName, tags.attributeName, tags.attributeValue], color: "var(--syn-prop)" },
  { tag: tags.invalid, color: "var(--err)" },
]);

export function editorSyntax(): Extension {
  return syntaxHighlighting(draculaHighlight);
}

export function editorExtensions(extra: Extension[] = []): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    bracketMatching(),
    highlightSelectionMatches(),
    editorSyntax(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    EditorView.lineWrapping,
    ...extra,
  ];
}

export function editorChrome(dark: boolean): Extension {
  return EditorView.theme(
    {
      "&": { height: "100%", backgroundColor: "var(--surface)", color: "var(--text)" },
      ".cm-scroller": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace" },
      ".cm-content": { fontSize: "13px", lineHeight: "1.5", padding: "4px 0", caretColor: "var(--accent)" },
      ".cm-line": { padding: "0 2px 0 4px" },
      ".cm-gutterElement": { lineHeight: "1.5" },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)" },
      "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "var(--selection)",
      },
      ".cm-gutters": {
        backgroundColor: "var(--surface-2)",
        color: "var(--muted)",
        borderRight: "1px solid var(--border)",
      },
      ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--hover)" },
      "&.cm-focused": { outline: "none" },
    },
    { dark },
  );
}
