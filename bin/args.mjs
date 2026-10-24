export function parseArgs(argv) {
  let port = 3000;
  let rebuild = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") return { help: true, port, rebuild };
    if (arg === "--rebuild") {
      rebuild = true;
      continue;
    }
    if (arg === "--port" || arg === "-p") {
      port = parsePort(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith("--port=")) {
      port = parsePort(arg.slice("--port=".length));
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return { help: false, port, rebuild };
}

function parsePort(value) {
  if (value == null || !/^\d+$/.test(value)) {
    throw new Error("Port must be an integer from 1 to 65535.");
  }
  const port = Number(value);
  if (port < 1 || port > 65535) throw new Error("Port must be an integer from 1 to 65535.");
  return port;
}
