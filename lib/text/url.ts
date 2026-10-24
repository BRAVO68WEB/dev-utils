export type UrlMode = "encode" | "decode";
export type UrlVariant = "component" | "uri";

export function transformUrl(input: string, mode: UrlMode, variant: UrlVariant, plusAsSpace: boolean) {
  try {
    if (mode === "encode") {
      const output = variant === "component" ? encodeURIComponent(input) : encodeURI(input);
      return { output, error: null as string | null };
    }
    const source = plusAsSpace ? input.replace(/\+/g, " ") : input;
    const output = variant === "component" ? decodeURIComponent(source) : decodeURI(source);
    return { output, error: null as string | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not decode that value.";
    return { output: "", error: message };
  }
}
