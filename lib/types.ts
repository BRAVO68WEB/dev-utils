export const toolIds = [
  "diff",
  "url",
  "params",
  "base64",
  "hooks",
  "http",
  "format",
  "markdown",
  "uml",
  "playground",
  "yaml",
  "jwt",
  "keys",
  "random",
  "sandbox",
] as const;

export type ToolId = (typeof toolIds)[number];

export type RecordKind =
  | "markdown"
  | "uml"
  | "http"
  | "webhook-inbox"
  | "webhook-event";

export type FieldRow = {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
};

export type DiffLanguage =
  | "plain"
  | "json"
  | "javascript"
  | "typescript"
  | "css"
  | "html"
  | "markdown"
  | "yaml";

export type DiffState = {
  left: string;
  right: string;
  language: DiffLanguage;
  ignoreWhitespace: boolean;
  view: "split" | "unified";
};

export type UrlState = {
  input: string;
  mode: "encode" | "decode";
  variant: "component" | "uri";
  plusAsSpace: boolean;
};

export type ParamsState = { url: string };

export type Base64State = {
  text: string;
  direction: "encode" | "decode";
  urlSafe: boolean;
};

export type HooksState = { activeInboxId: string | null };

export type HttpBodyType = "none" | "text" | "json" | "form";

export type HttpDraft = {
  method: string;
  url: string;
  query: FieldRow[];
  headers: FieldRow[];
  body: string;
  bodyType: HttpBodyType;
  allowMetadata: boolean;
};

export type FormatParser =
  | "babel"
  | "typescript"
  | "json"
  | "css"
  | "scss"
  | "html"
  | "markdown"
  | "yaml";

export type FormatState = { source: string; parser: FormatParser };

export type MarkdownState = { activeId: string | null };

export type UmlState = { activeId: string | null };

export type PlaygroundState = {
  tab: "jq" | "grep";
  jq: { input: string; filter: string; compact: boolean; raw: boolean };
  grep: {
    text: string;
    pattern: string;
    literal: boolean;
    insensitive: boolean;
    invert: boolean;
    before: number;
    after: number;
  };
};

export type YamlState = { source: string };

export type JwtAlg = "HS256" | "HS384" | "HS512";

export type JwtState = {
  token: string;
  header: string;
  payload: string;
  secret: string;
  alg: JwtAlg;
};

export type KeyAlg = "RSA-2048" | "RSA-4096" | "P-256" | "P-384" | "Ed25519";

export type KeysState = {
  alg: KeyAlg;
  publicPem: string;
  privatePem: string;
  publicJwk: string;
  privateJwk: string;
};

export type RandomState = {
  length: number;
  count: number;
  lower: boolean;
  upper: boolean;
  numbers: boolean;
  special: boolean;
  output: string;
};

export type SandboxState = { source: string };

export type SessionStateMap = {
  diff: DiffState;
  url: UrlState;
  params: ParamsState;
  base64: Base64State;
  hooks: HooksState;
  http: HttpDraft;
  format: FormatState;
  markdown: MarkdownState;
  uml: UmlState;
  playground: PlaygroundState;
  yaml: YamlState;
  jwt: JwtState;
  keys: KeysState;
  random: RandomState;
  sandbox: SandboxState;
};

export type MarkdownComment = {
  id: string;
  quote: string;
  occurrence: number;
  note: string;
  createdAt: number;
};

export type MarkdownBody = {
  markdown: string;
  comments: MarkdownComment[];
};

export type UmlBody = { source: string };

export type HttpResponseView = {
  status: number;
  statusText: string;
  ms: number;
  size: number;
  headers: [string, string][];
  body: string;
  truncated: boolean;
  contentType: string | null;
  encoding: "utf8" | "base64";
  redirects: { url: string; status: number }[];
};

export type HttpRecordBody = {
  request: HttpDraft;
  response: HttpResponseView | null;
  error: string | null;
};

export type WebhookInboxBody = {
  responseStatus: number;
  responseBody: string;
  contentType: string;
};

export type WebhookEventBody = {
  id: string;
  method: string;
  path: string;
  query: [string, string][];
  headers: [string, string][];
  body: string;
  bodyEncoding: "utf8" | "base64";
  truncated: boolean;
  contentType: string | null;
  receivedAt: number;
};

export type ToolRecord<T = unknown> = {
  id: string;
  kind: RecordKind;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  title: string;
  body: T;
};

export type SessionRow = {
  tool: ToolId;
  updatedAt: number;
  state: unknown;
};

export type SettingRow = { key: string; value: unknown };

export type Dump = {
  version: 1;
  exportedAt: string;
  sessions: SessionRow[];
  records: ToolRecord[];
  settings: SettingRow[];
};

export function newId(): string {
  return crypto.randomUUID();
}

export function fieldRow(name = "", value = "", enabled = true): FieldRow {
  return { id: newId(), name, value, enabled };
}
