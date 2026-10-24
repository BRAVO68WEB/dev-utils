export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadText(filename: string, text: string, type = "text/plain") {
  downloadBlob(filename, new Blob([text], { type }));
}

export function downloadJson(filename: string, data: unknown) {
  downloadText(filename, JSON.stringify(data, null, 2), "application/json");
}
