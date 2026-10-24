import { describe, expect, it } from "vitest";
import { parseArgs } from "../bin/args.mjs";

describe("dev-utils arguments", () => {
  it("defaults to port 3000 and does not rebuild", () => {
    expect(parseArgs([])).toEqual({ help: false, port: 3000, rebuild: false });
  });

  it("reads --port and -p", () => {
    expect(parseArgs(["--port", "1234"]).port).toBe(1234);
    expect(parseArgs(["-p", "1234"]).port).toBe(1234);
    expect(parseArgs(["--port=8080"]).port).toBe(8080);
  });

  it("rejects a port that is not a valid integer", () => {
    expect(() => parseArgs(["--port", "0"])).toThrow(/1 to 65535/);
    expect(() => parseArgs(["--port", "70000"])).toThrow(/1 to 65535/);
    expect(() => parseArgs(["--port", "abc"])).toThrow(/1 to 65535/);
    expect(() => parseArgs(["--port"])).toThrow(/1 to 65535/);
    expect(() => parseArgs(["--nope"])).toThrow(/Unknown argument/);
  });

  it("records --rebuild", () => {
    expect(parseArgs(["--rebuild", "--port", "4000"])).toEqual({ help: false, port: 4000, rebuild: true });
  });
});
