export const sandboxDocument = `<!doctype html>
<meta charset="utf-8">
<script>
  const send = (message) => parent.postMessage(message, "*");
  const format = (value) => {
    if (typeof value === "undefined") return "undefined";
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.stack || value.message;
    try { return JSON.stringify(value, null, 2); }
    catch { return String(value); }
  };
  for (const level of ["log", "info", "warn", "error"]) {
    console[level] = (...args) => send({ type: "log", level, args: args.map(format) });
  }
  window.addEventListener("error", (event) => {
    send({ type: "log", level: "error", args: [format(event.error || event.message)] });
  });
  window.addEventListener("unhandledrejection", (event) => {
    send({ type: "log", level: "error", args: [format(event.reason)] });
  });
  window.addEventListener("message", async (event) => {
    if (!event.data || event.data.type !== "run") return;
    try {
      const result = await (0, eval)("(async () => {\\n" + event.data.code + "\\n})()");
      send({ type: "result", value: format(result) });
    } catch (error) {
      send({ type: "log", level: "error", args: [format(error)] });
    } finally {
      send({ type: "done" });
    }
  });
</script>
`;
