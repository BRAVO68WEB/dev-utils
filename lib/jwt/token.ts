import { decodeToBytes, encodeBytes, encodeUtf8 } from "@/lib/text/base64";

export const hmacAlgs = ["HS256", "HS384", "HS512"] as const;
export type HmacAlg = (typeof hmacAlgs)[number];

const hashByAlg: Record<HmacAlg, "SHA-256" | "SHA-384" | "SHA-512"> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

export type JwtView = {
  ok: boolean;
  error: string | null;
  headerText: string;
  payloadText: string;
  signature: string;
  alg: string | null;
};

export function decodeJwt(token: string): JwtView {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return { ok: false, error: "A JWT has three base64url parts separated by dots.", headerText: "", payloadText: "", signature: "", alg: null };
  }
  try {
    const headerText = prettyJson(new TextDecoder().decode(decodeToBytes(parts[0], true)));
    const payloadText = prettyJson(new TextDecoder().decode(decodeToBytes(parts[1], true)));
    const header = JSON.parse(headerText) as { alg?: unknown };
    return {
      ok: true,
      error: null,
      headerText,
      payloadText,
      signature: parts[2],
      alg: typeof header.alg === "string" ? header.alg : null,
    };
  } catch {
    return { ok: false, error: "The header or payload is not base64url-encoded JSON.", headerText: "", payloadText: "", signature: parts[2] ?? "", alg: null };
  }
}

export function claimTimes(payloadText: string): { label: string; value: string }[] {
  let payload: unknown;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return [];
  }
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  return (["iat", "nbf", "exp"] as const).flatMap((label) => {
    const value = record[label];
    if (typeof value !== "number" || !Number.isFinite(value)) return [];
    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) return [];
    return [{ label, value: date.toISOString() }];
  });
}

export async function signJwt(headerText: string, payloadText: string, secret: string, alg: HmacAlg) {
  const header = JSON.parse(headerText) as Record<string, unknown>;
  const payload = JSON.parse(payloadText) as unknown;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("The payload must be a JSON object.");
  }
  header.alg = alg;
  header.typ = typeof header.typ === "string" ? header.typ : "JWT";
  const encodedHeader = encodeUtf8(JSON.stringify(header), true);
  const encodedPayload = encodeUtf8(JSON.stringify(payload), true);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmac(signingInput, secret, alg);
  return {
    token: `${signingInput}.${signature}`,
    headerText: prettyJson(JSON.stringify(header)),
    payloadText: prettyJson(JSON.stringify(payload)),
  };
}

export async function verifyJwt(token: string, secret: string, alg: HmacAlg) {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return false;
  const expected = await hmac(`${parts[0]}.${parts[1]}`, secret, alg);
  return expected === parts[2];
}

export function isHmacAlg(alg: string | null): alg is HmacAlg {
  return hmacAlgs.includes(alg as HmacAlg);
}

async function hmac(input: string, secret: string, alg: HmacAlg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: hashByAlg[alg] }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return encodeBytes(new Uint8Array(signature), true);
}

function prettyJson(text: string) {
  return JSON.stringify(JSON.parse(text), null, 2);
}
