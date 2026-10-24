import { toPem } from "@/lib/keys/pem";

export const keyAlgs = ["RSA-2048", "RSA-4096", "P-256", "P-384", "Ed25519"] as const;
export type KeyAlg = (typeof keyAlgs)[number];

export type Keypair = {
  publicPem: string;
  privatePem: string;
  publicJwk: string;
  privateJwk: string;
};

export async function generateKeypair(alg: KeyAlg): Promise<Keypair> {
  const pair = (await crypto.subtle.generateKey(algorithm(alg), true, ["sign", "verify"])) as CryptoKeyPair;
  const [publicPem, privatePem, publicJwk, privateJwk] = await Promise.all([
    crypto.subtle.exportKey("spki", pair.publicKey).then((bytes) => toPem("PUBLIC KEY", bytes)),
    crypto.subtle.exportKey("pkcs8", pair.privateKey).then((bytes) => toPem("PRIVATE KEY", bytes)),
    crypto.subtle.exportKey("jwk", pair.publicKey).then((jwk) => JSON.stringify(jwk, null, 2)),
    crypto.subtle.exportKey("jwk", pair.privateKey).then((jwk) => JSON.stringify(jwk, null, 2)),
  ]);
  return { publicPem, privatePem, publicJwk, privateJwk };
}

function algorithm(alg: KeyAlg): RsaHashedKeyGenParams | EcKeyGenParams | AlgorithmIdentifier {
  if (alg === "RSA-2048" || alg === "RSA-4096") {
    return {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: alg === "RSA-4096" ? 4096 : 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    };
  }
  if (alg === "Ed25519") return { name: "Ed25519" };
  return { name: "ECDSA", namedCurve: alg };
}

