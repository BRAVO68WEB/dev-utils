import type { Metadata } from "next";
import { FormatWorkspace } from "@/app/format/workspace";

export const metadata: Metadata = { title: "Format" };

export default function Page() {
  return <FormatWorkspace />;
}
