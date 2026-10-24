"use client";

import { useEffect, useState } from "react";
import { Banner, Button, Loading, fieldClass } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { CodeEditor } from "@/components/editor/code-editor";
import { initialStates, umlSample } from "@/lib/defaults";
import { deleteRecord, putRecord } from "@/lib/db/index";
import { useDraftRecord } from "@/lib/db/use-draft-record";
import { useRecords } from "@/lib/db/use-records";
import { useSession } from "@/lib/db/use-session";
import { downloadBlob, downloadText } from "@/lib/download";
import { svgToPng, withXmlns } from "@/lib/uml/raster";
import { newId, type UmlBody } from "@/lib/types";
import { useResolvedTheme } from "@/components/shell/use-theme";

export function UmlWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("uml", initialStates.uml);
  const { rows } = useRecords<UmlBody>("uml");
  const active = rows.find((row) => row.id === state.activeId) ?? null;
  const draftRecord = useDraftRecord(active);
  const [svg, setSvg] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const theme = useResolvedTheme();

  useEffect(() => {
    const source = draftRecord.draft?.source;
    if (!source?.trim()) return;
    let cancel = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const mermaid = (await import("mermaid")).default;
          const dracula = theme === "dark";
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            htmlLabels: false,
            theme: dracula ? "dark" : "default",
            themeVariables: dracula
              ? {
                  darkMode: true,
                  background: "#282a36",
                  primaryColor: "#44475a",
                  primaryTextColor: "#f8f8f2",
                  primaryBorderColor: "#bd93f9",
                  secondaryColor: "#343746",
                  tertiaryColor: "#21222c",
                  lineColor: "#bd93f9",
                  textColor: "#f8f8f2",
                  noteBkgColor: "#343746",
                  noteTextColor: "#f8f8f2",
                }
              : {
                  background: "#f8f8f2",
                  primaryColor: "#efe8fb",
                  primaryTextColor: "#282a36",
                  primaryBorderColor: "#6d49b2",
                  lineColor: "#6d49b2",
                  textColor: "#282a36",
                },
            flowchart: { htmlLabels: false },
          });
          const rendered = await mermaid.render(`uml-${active?.id ?? "draft"}-${Date.now()}`, source);
          if (cancel) return;
          setSvg(rendered.svg);
          setProblem(null);
        } catch (renderError) {
          if (cancel) return;
          setProblem(renderError instanceof Error ? renderError.message : "The diagram could not be rendered.");
        }
      })();
    }, 300);
    return () => {
      cancel = true;
      window.clearTimeout(handle);
    };
  }, [active?.id, draftRecord.draft?.source, theme]);

  if (!ready) return <Loading />;
  const diagram = draftRecord.draft?.source.trim() ? svg : "";
  const diagramProblem = draftRecord.draft?.source.trim() ? problem : null;

  async function createDoc() {
    const id = newId();
    const now = Date.now();
    await putRecord({
      id,
      kind: "uml",
      parentId: null,
      createdAt: now,
      updatedAt: now,
      title: "Untitled diagram",
      body: { source: umlSample },
    });
    setState({ activeId: id });
  }

  async function exportPng() {
    try {
      const blob = await svgToPng(diagram);
      downloadBlob(`${draftRecord.title || "diagram"}.png`, blob);
      setExportError(null);
    } catch (pngError) {
      setExportError(pngError instanceof Error ? pngError.message : "Could not export a PNG. Download the SVG instead.");
    }
  }

  async function copyPng() {
    try {
      const blob = await svgToPng(diagram);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setExportError(null);
    } catch {
      setExportError("The clipboard blocked the image. Download the PNG instead.");
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-52 shrink-0 flex-col border-r border-line">
        <div className="border-b border-line p-2">
          <Button type="button" variant="primary" onClick={() => void createDoc()}>
            New diagram
          </Button>
        </div>
        <ul className="min-h-0 flex-1 overflow-auto">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className={`block w-full truncate px-3 py-2 text-left text-sm hover:bg-surface-2 ${row.id === state.activeId ? "bg-surface-2 font-medium" : ""}`}
                onClick={() => setState({ activeId: row.id })}
              >
                {row.title || "Untitled diagram"}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
        {diagramProblem ? <Banner>{diagramProblem}</Banner> : null}
        {exportError ? <Banner onDismiss={() => setExportError(null)}>{exportError}</Banner> : null}
        {!active || !draftRecord.draft ? (
          <div className="flex h-full flex-col items-start justify-center gap-3 p-8">
            <h2 className="text-base font-semibold">No diagram open</h2>
            <p className="max-w-md text-sm text-muted">Write a Mermaid diagram. Sequence, class, state, ER, flowchart, and C4 diagrams render here.</p>
            <Button type="button" variant="primary" onClick={() => void createDoc()}>
              New diagram
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
              <input className={`${fieldClass} max-w-xs`} aria-label="Title" value={draftRecord.title} onChange={(event) => draftRecord.updateTitle(event.target.value)} />
              <Button type="button" disabled={!diagram} onClick={() => downloadText(`${draftRecord.title || "diagram"}.svg`, withXmlns(diagram), "image/svg+xml")}>
                SVG
              </Button>
              <Button type="button" disabled={!diagram} onClick={() => void exportPng()}>
                PNG
              </Button>
              <Button type="button" disabled={!diagram} onClick={() => void copyPng()}>
                Copy PNG
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (!window.confirm("Delete this diagram from this browser?")) return;
                  void deleteRecord(active.id);
                  setState({ activeId: rows.find((row) => row.id !== active.id)?.id ?? null });
                }}
              >
                Delete
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <SplitPane
                first={
                  <CodeEditor
                    value={draftRecord.draft.source}
                    language="markdown"
                    onChange={(source) => draftRecord.update({ source })}
                  />
                }
                second={
                  <div
                    className="uml-stage h-full overflow-auto bg-surface p-4"
                    aria-label="Diagram"
                    dangerouslySetInnerHTML={{ __html: diagram }}
                  />
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
