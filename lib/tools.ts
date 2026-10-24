import type { RecordKind, ToolId } from "@/lib/types";

export type Tool = {
  id: ToolId;
  href: string;
  name: string;
  shortcut: string;
  blurb: string;
};

export const tools: Tool[] = [
  {
    id: "diff",
    href: "/diff",
    name: "Diff",
    shortcut: "1",
    blurb: "Compare two texts, side by side or unified.",
  },
  {
    id: "url",
    href: "/url",
    name: "URL encode",
    shortcut: "2",
    blurb: "Encode and decode a URL or a single component.",
  },
  {
    id: "params",
    href: "/params",
    name: "URL params",
    shortcut: "3",
    blurb: "Read and edit query parameters without losing duplicates.",
  },
  {
    id: "base64",
    href: "/base64",
    name: "Base64",
    shortcut: "4",
    blurb: "Encode and decode UTF-8 text, or a dropped file.",
  },
  {
    id: "hooks",
    href: "/hooks",
    name: "Webhooks",
    shortcut: "5",
    blurb: "Capture HTTP requests sent to this machine.",
  },
  {
    id: "http",
    href: "/http",
    name: "HTTP",
    shortcut: "6",
    blurb: "Paste a curl command, edit it, and send it.",
  },
  {
    id: "format",
    href: "/format",
    name: "Format",
    shortcut: "7",
    blurb: "Format code with Prettier. Undo restores the previous text.",
  },
  {
    id: "markdown",
    href: "/markdown",
    name: "Markdown",
    shortcut: "8",
    blurb: "Write Markdown, preview it, and leave review notes.",
  },
  {
    id: "uml",
    href: "/uml",
    name: "UML",
    shortcut: "9",
    blurb: "Render a Mermaid diagram and export SVG or PNG.",
  },
  {
    id: "playground",
    href: "/playground",
    name: "jq and grep",
    shortcut: "0",
    blurb: "Run a jq filter or a JavaScript regular expression.",
  },
  {
    id: "yaml",
    href: "/yaml",
    name: "YAML",
    shortcut: "-",
    blurb: "Validate YAML and jump to the reported line.",
  },
  {
    id: "jwt",
    href: "/jwt",
    name: "JWT",
    shortcut: "j",
    blurb: "Read a token, edit its claims, and sign it again.",
  },
  {
    id: "keys",
    href: "/keys",
    name: "Keypairs",
    shortcut: "k",
    blurb: "Generate a signing keypair and copy PEM or JWK.",
  },
  {
    id: "random",
    href: "/random",
    name: "Random",
    shortcut: "r",
    blurb: "Generate random strings with the character sets you choose.",
  },
  {
    id: "sandbox",
    href: "/sandbox",
    name: "JS sandbox",
    shortcut: "s",
    blurb: "Run JavaScript in a frame that cannot read saved tools.",
  },
];

export function toolFromPath(pathname: string): Tool | null {
  return tools.find((tool) => pathname === tool.href) ?? null;
}

export function toolByShortcut(shortcut: string): Tool | null {
  return tools.find((tool) => tool.shortcut === shortcut) ?? null;
}

const kinds: Partial<Record<ToolId, RecordKind[]>> = {
  markdown: ["markdown"],
  uml: ["uml"],
  http: ["http"],
  hooks: ["webhook-inbox", "webhook-event"],
};

export function kindsForTool(tool: ToolId): RecordKind[] {
  return kinds[tool] ?? [];
}
