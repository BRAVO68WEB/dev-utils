import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import type { Extension } from "@codemirror/state";
import type { DiffLanguage } from "@/lib/types";

export function languageExtension(language: DiffLanguage | string): Extension[] {
  switch (language) {
    case "javascript":
      return [javascript()];
    case "typescript":
      return [javascript({ typescript: true, jsx: true })];
    case "json":
      return [json()];
    case "markdown":
      return [markdown()];
    case "yaml":
      return [yaml()];
    case "html":
      return [html()];
    case "css":
      return [css()];
    default:
      return [];
  }
}
