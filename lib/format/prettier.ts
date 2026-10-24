import type { Plugin } from "prettier";
import type { FormatParser } from "@/lib/types";

const pluginLoaders: Record<FormatParser, () => Promise<unknown[]>> = {
  babel: async () => [await import("prettier/plugins/babel"), await import("prettier/plugins/estree")],
  typescript: async () => [await import("prettier/plugins/typescript"), await import("prettier/plugins/estree")],
  json: async () => [await import("prettier/plugins/babel"), await import("prettier/plugins/estree")],
  css: async () => [await import("prettier/plugins/postcss")],
  scss: async () => [await import("prettier/plugins/postcss")],
  html: async () => [await import("prettier/plugins/html")],
  markdown: async () => [await import("prettier/plugins/markdown")],
  yaml: async () => [await import("prettier/plugins/yaml")],
};

export async function formatSource(source: string, parser: FormatParser) {
  const prettier = await import("prettier/standalone");
  const plugins = (await pluginLoaders[parser]()) as Plugin[];
  return prettier.format(source, { parser, plugins });
}
