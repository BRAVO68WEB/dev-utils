import { decodeJwt } from "@/lib/jwt/token";
import { fieldRow, type SessionStateMap } from "@/lib/types";

const jwtSample =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const jwtDecoded = decodeJwt(jwtSample);

export const initialStates: SessionStateMap = {
  diff: {
    left: "const total = 1\n",
    right: "const total = 2\n",
    language: "javascript",
    ignoreWhitespace: false,
    view: "split",
  },
  url: {
    input: "hello world?",
    mode: "encode",
    variant: "component",
    plusAsSpace: false,
  },
  params: {
    url: "https://example.com/search?q=cat&q=dog&page=#results",
  },
  base64: {
    text: "dev utils",
    direction: "encode",
    urlSafe: false,
  },
  hooks: { activeInboxId: null },
  http: {
    method: "GET",
    url: "https://example.com",
    query: [],
    headers: [fieldRow("Accept", "application/json")],
    body: "",
    bodyType: "none",
    allowMetadata: false,
  },
  format: {
    source: "function add( a,b ){return a+b}",
    parser: "babel",
  },
  markdown: { activeId: null },
  uml: { activeId: null },
  playground: {
    tab: "jq",
    jq: {
      input:
        '{\n  "items": [\n    { "active": true, "name": "Ada" },\n    { "active": false, "name": "Bea" }\n  ]\n}\n',
      filter: ".items | map(select(.active)) | .[].name",
      compact: true,
      raw: true,
    },
    grep: {
      text: "info ready\nerror: disk full\nerror: timeout\ninfo done\n",
      pattern: "error",
      literal: false,
      insensitive: true,
      invert: false,
      before: 0,
      after: 0,
    },
  },
  yaml: {
    source: "name: dev-utils\nenabled: true\nports:\n  - 3000\n",
  },
  jwt: {
    token: jwtSample,
    header: jwtDecoded.headerText,
    payload: jwtDecoded.payloadText,
    secret: "your-256-bit-secret",
    alg: "HS256",
  },
  keys: {
    alg: "P-256",
    publicPem: "",
    privatePem: "",
    publicJwk: "",
    privateJwk: "",
  },
  random: {
    length: 24,
    count: 5,
    lower: true,
    upper: true,
    numbers: true,
    special: false,
    output: "",
  },
  sandbox: {
    source: "const values = [1, 2, 3];\nconsole.log(values.map((n) => n * n));\nreturn values.length;\n",
  },
};

export const markdownSample = `# Notes

A paragraph with **bold** and a [link](https://example.com).

- one
- two

| Col | Val |
| --- | --- |
| a | b |
`;

export const umlSample = `sequenceDiagram
  participant Dev
  participant Util
  Dev->>Util: paste a diagram
  Util-->>Dev: rendered SVG
`;

export const QUOTA_MESSAGE =
  "This browser refused to store more data. Export your data or clear a tool.";
