"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { CodeEditor } from "@/components/editor/code-editor";
import { Banner, Button, Loading, fieldClass } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { markdownSample } from "@/lib/defaults";
import { deleteRecord, putRecord } from "@/lib/db/index";
import { useDraftRecord } from "@/lib/db/use-draft-record";
import { useRecords } from "@/lib/db/use-records";
import { useSession } from "@/lib/db/use-session";
import { initialStates } from "@/lib/defaults";
import { downloadText } from "@/lib/download";
import { newId, type MarkdownBody, type MarkdownComment } from "@/lib/types";

export function MarkdownWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("markdown", initialStates.markdown);
  const { rows } = useRecords<MarkdownBody>("markdown");
  const active = rows.find((row) => row.id === state.activeId) ?? null;
  const draftRecord = useDraftRecord(active);
  const previewRef = useRef<HTMLDivElement>(null);
  const [quote, setQuote] = useState<{ quote: string; occurrence: number } | null>(null);
  const [note, setNote] = useState("");

  const outline = useMemo(() => {
    const source = draftRecord.draft?.markdown ?? "";
    return [...source.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
      level: match[1]?.length ?? 1,
      text: match[2] ?? "",
    }));
  }, [draftRecord.draft?.markdown]);

  if (!ready) return <Loading />;

  async function createDoc() {
    const id = newId();
    const now = Date.now();
    await putRecord({
      id,
      kind: "markdown",
      parentId: null,
      createdAt: now,
      updatedAt: now,
      title: "Untitled",
      body: { markdown: markdownSample, comments: [] } satisfies MarkdownBody,
    });
    setState({ activeId: id });
  }

  function captureSelection() {
    const root = previewRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.isCollapsed || !selection.anchorNode || !root.contains(selection.anchorNode)) {
      setQuote(null);
      return;
    }
    const text = selection.toString().trim();
    if (!text) {
      setQuote(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(root);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const occurrence = beforeRange.toString().split(text).length - 1;
    setQuote({ quote: text, occurrence });
  }

  function addNote() {
    if (!draftRecord.draft || !quote || !note.trim()) return;
    const comment: MarkdownComment = { id: newId(), quote: quote.quote, occurrence: quote.occurrence, note: note.trim(), createdAt: Date.now() };
    draftRecord.update({ ...draftRecord.draft, comments: [...draftRecord.draft.comments, comment] });
    setNote("");
    setQuote(null);
  }

  const words = (draftRecord.draft?.markdown.trim().match(/\S+/g) ?? []).length;

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-52 shrink-0 flex-col border-r border-line">
        <div className="border-b border-line p-2">
          <Button type="button" variant="primary" onClick={() => void createDoc()}>
            New document
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
                {row.title || "Untitled"}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
        {!active || !draftRecord.draft ? (
          <div className="flex h-full flex-col items-start justify-center gap-3 p-8">
            <h2 className="text-base font-semibold">No document open</h2>
            <p className="max-w-md text-sm text-muted">Create a document to write Markdown, read the preview, and leave notes beside quotes.</p>
            <Button type="button" variant="primary" onClick={() => void createDoc()}>
              New document
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
              <input className={`${fieldClass} max-w-xs`} aria-label="Title" value={draftRecord.title} onChange={(event) => draftRecord.updateTitle(event.target.value)} />
              <span className="text-xs text-muted">{words} words</span>
              <Button
                type="button"
                onClick={() => downloadText(`${draftRecord.title || "notes"}.md`, draftRecord.draft?.markdown ?? "", "text/markdown")}
              >
                Download
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (!window.confirm("Delete this document from this browser?")) return;
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
                    value={draftRecord.draft.markdown}
                    language="markdown"
                    onChange={(markdown) => draftRecord.update({ ...draftRecord.draft!, markdown })}
                  />
                }
                second={
                  <div className="flex h-full min-h-0 flex-col">
                    {outline.length > 0 ? (
                      <ol className="flex max-h-24 flex-wrap gap-x-3 gap-y-1 overflow-auto border-b border-line px-3 py-2 text-xs text-muted">
                        {outline.map((heading, index) => (
                          <li key={`${heading.text}-${index}`} style={{ paddingLeft: (heading.level - 1) * 8 }}>
                            {heading.text}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem]">
                      <div ref={previewRef} onMouseUp={captureSelection} className="markdown-body min-h-0 overflow-auto px-4 py-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                          {draftRecord.draft.markdown}
                        </ReactMarkdown>
                      </div>
                      <aside className="min-h-0 overflow-auto border-t border-line p-3 lg:border-t-0 lg:border-l">
                        <p className="text-sm font-medium">Notes</p>
                        {quote ? <p className="mt-2 text-xs text-muted">Selected: “{quote.quote}”</p> : <p className="mt-2 text-xs text-muted">Select preview text to attach a note.</p>}
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          aria-label="Review note"
                          className="mt-2 h-20 w-full resize-none rounded-md border border-line bg-surface p-2 text-sm"
                        />
                        <Button type="button" className="mt-2" disabled={!quote || !note.trim()} onClick={addNote}>
                          Add note
                        </Button>
                        <ul className="mt-3 flex flex-col gap-3">
                          {draftRecord.draft.comments.map((comment) => (
                            <li key={comment.id} className="rounded-md border border-line p-2">
                              <p className="text-xs text-muted">
                                “{comment.quote}”{comment.occurrence > 0 ? ` · match ${comment.occurrence + 1}` : ""}
                              </p>
                              <p className="mt-1 text-sm">{comment.note}</p>
                              <button
                                type="button"
                                className="mt-1 text-xs text-err"
                                onClick={() =>
                                  draftRecord.update({
                                    ...draftRecord.draft!,
                                    comments: draftRecord.draft!.comments.filter((item) => item.id !== comment.id),
                                  })
                                }
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </aside>
                    </div>
                  </div>
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
