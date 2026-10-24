import { describe, expect, it } from "vitest";
import { generateKeypair } from "@/lib/keys/generate";
import { claimTimes, decodeJwt, signJwt, verifyJwt } from "@/lib/jwt/token";
import { alphabet, randomStrings } from "@/lib/random/strings";
import { initialStates } from "@/lib/defaults";

describe("JWT", () => {
  it("reads the sample header, payload, and issued-at time", () => {
    const decoded = decodeJwt(initialStates.jwt.token);
    expect(decoded.ok).toBe(true);
    expect(decoded.alg).toBe("HS256");
    expect(JSON.parse(decoded.payloadText)).toMatchObject({ name: "John Doe" });
    expect(claimTimes(decoded.payloadText)).toEqual([{ label: "iat", value: "2018-01-18T01:30:22.000Z" }]);
  });

  it("signs an edited payload and verifies it", async () => {
    const signed = await signJwt(initialStates.jwt.header, '{"sub":"ada"}', "secret", "HS256");
    expect(JSON.parse(decodeJwt(signed.token).payloadText)).toEqual({ sub: "ada" });
    expect(await verifyJwt(signed.token, "secret", "HS256")).toBe(true);
    expect(await verifyJwt(signed.token, "other", "HS256")).toBe(false);
  });

  it("rejects a token that is not three parts", () => {
    expect(decodeJwt("nope").ok).toBe(false);
  });
});

describe("random strings", () => {
  it("uses only the selected sets and the requested size", () => {
    const result = randomStrings({ length: 32, count: 4, lower: false, upper: false, numbers: true, special: false });
    expect(result.error).toBeNull();
    expect(result.values).toHaveLength(4);
    for (const value of result.values) {
      expect(value).toMatch(/^[0-9]{32}$/);
    }
  });

  it("requires a character set and a usable length", () => {
    expect(randomStrings({ length: 8, count: 1, lower: false, upper: false, numbers: false, special: false }).error).toMatch(/character set/);
    expect(randomStrings({ length: 0, count: 1, lower: true, upper: false, numbers: false, special: false }).error).toMatch(/Length/);
    expect(alphabet({ length: 1, count: 1, lower: true, upper: true, numbers: false, special: true })).toContain("A");
  });
});

describe("keypairs", () => {
  it("generates a P-256 PEM pair", async () => {
    const pair = await generateKeypair("P-256");
    expect(pair.publicPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
    expect(pair.privatePem).toMatch(/^-----BEGIN PRIVATE KEY-----/);
    expect(JSON.parse(pair.publicJwk).kty).toBe("EC");
    expect(JSON.parse(pair.privateJwk).d).toBeTruthy();
  });
});
