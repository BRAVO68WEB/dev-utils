export function encodeBytes(bytes: Uint8Array, urlSafe: boolean) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  const standard = btoa(binary);
  if (!urlSafe) return standard;
  return standard.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function encodeUtf8(text: string, urlSafe: boolean) {
  return encodeBytes(new TextEncoder().encode(text), urlSafe);
}

export function decodeToBytes(input: string, urlSafe: boolean) {
  let normalized = input.trim().replace(/\s/g, "");
  if (!normalized) return new Uint8Array();
  if (urlSafe) normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  if (padding) normalized += "=".repeat(4 - padding);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error("Invalid base64.");
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function decodeBase64(input: string, urlSafe: boolean) {
  try {
    const bytes = decodeToBytes(input, urlSafe);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { text, error: null as string | null };
  } catch {
    return { text: "", error: "That value is not valid base64, or it is not UTF-8 text." };
  }
}

export function describeBody(bytes: Uint8Array) {
  const sample = bytes.subarray(0, 1024);
  for (const byte of sample) {
    if (byte === 0) return { body: encodeBytes(bytes, false), bodyEncoding: "base64" as const };
  }
  return { body: new TextDecoder("utf-8", { fatal: false }).decode(bytes), bodyEncoding: "utf8" as const };
}
