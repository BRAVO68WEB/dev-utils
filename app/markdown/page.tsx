import type { Metadata } from "next";
import { MarkdownWorkspace } from "@/app/markdown/workspace";

export const metadata: Metadata = { title: "Markdown" };

export default function Page() {
  return <MarkdownWorkspace />;
}
