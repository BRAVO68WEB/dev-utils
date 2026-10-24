import { encodeBytes } from "@/lib/text/base64";

export function toPem(label: "PUBLIC KEY" | "PRIVATE KEY", bytes: ArrayBuffer) {
  const encoded = encodeBytes(new Uint8Array(bytes), false);
  const lines = encoded.match(/.{1,64}/g)?.join("\n") ?? encoded;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}
