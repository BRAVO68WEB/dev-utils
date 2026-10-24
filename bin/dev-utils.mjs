#!/usr/bin/env node
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./args.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

const usage = `Usage: dev-utils [--port <n>] [--rebuild]

  --port, -p   Port to listen on. Default 3000.
  --rebuild    Build again before starting.
  --help       Show this help.
`;

let parsed;
try {
  parsed = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (parsed.help) {
  console.log(usage);
  process.exit(0);
}

const stage = path.join(os.homedir(), ".cache", "dev-utils", pkg.version);
prepareStage(stage, parsed.rebuild);
await installDependencies(stage);
const nextBin = path.join(stage, "node_modules/next/dist/bin/next");
const built = existsSync(path.join(stage, ".next", "BUILD_ID"));

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], {
      cwd: stage,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`next ${args[0]} received ${signal}`));
      else if (code === 0) resolve();
      else reject(new Error(`next ${args[0]} exited with ${code ?? "no"} status`));
    });
  });
}

if (!built || parsed.rebuild) {
  console.log(parsed.rebuild ? "Rebuilding Dev Utils…" : "Building Dev Utils. The first run of this version takes a minute.");
  await run(["build"]);
}

function prepareStage(stageDir, rebuild) {
  mkdirSync(stageDir, { recursive: true });
  const stamp = path.join(stageDir, ".source-version");
  const stamped = existsSync(stamp) && readFileSync(stamp, "utf8") === pkg.version;
  if (!stamped || rebuild) {
    for (const name of ["app", "components", "lib", "public"]) {
      const destination = path.join(stageDir, name);
      rmSync(destination, { recursive: true, force: true });
      cpSync(path.join(root, name), destination, { recursive: true });
    }
    for (const name of ["package.json", "next.config.ts", "postcss.config.mjs", "tsconfig.json"]) {
      cpSync(path.join(root, name), path.join(stageDir, name));
    }
    if (rebuild) rmSync(path.join(stageDir, ".next"), { recursive: true, force: true });
    writeFileSync(stamp, pkg.version);
  }
}

function installDependencies(stageDir) {
  if (existsSync(path.join(stageDir, "node_modules", "next"))) return Promise.resolve();
  console.log("Installing Dev Utils dependencies…");
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["install"], { cwd: stageDir, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`bun install exited with ${code ?? "no"} status`));
    });
  });
}

console.log(`Dev Utils is at http://127.0.0.1:${parsed.port}`);
await run(["start", "--hostname", "127.0.0.1", "--port", String(parsed.port)]);
