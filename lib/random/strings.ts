export type RandomOptions = {
  length: number;
  count: number;
  lower: boolean;
  upper: boolean;
  numbers: boolean;
  special: boolean;
};

export const randomSpecials = "!@#$%^&*()-_=+[]{};:,.?";

export function randomProblem(options: RandomOptions): string | null {
  if (!Number.isInteger(options.length) || options.length < 1 || options.length > 2048) {
    return "Length must be an integer from 1 to 2048.";
  }
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 200) {
    return "Count must be an integer from 1 to 200.";
  }
  if (!alphabet(options)) return "Choose at least one character set.";
  return null;
}

export function randomStrings(options: RandomOptions): { values: string[]; error: string | null } {
  const problem = randomProblem(options);
  if (problem) return { values: [], error: problem };
  const chars = alphabet(options);
  const limit = 256 - (256 % chars.length);
  const values: string[] = [];
  for (let index = 0; index < options.count; index += 1) {
    let value = "";
    while (value.length < options.length) {
      const bytes = new Uint8Array(Math.max(options.length, 16));
      crypto.getRandomValues(bytes);
      for (const byte of bytes) {
        if (byte >= limit) continue;
        value += chars[byte % chars.length];
        if (value.length === options.length) break;
      }
    }
    values.push(value);
  }
  return { values, error: null };
}

export function alphabet(options: RandomOptions) {
  let chars = "";
  if (options.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.numbers) chars += "0123456789";
  if (options.special) chars += randomSpecials;
  return chars;
}
