import type { Metadata } from "next";
import { DiffWorkspace } from "@/app/diff/workspace";

export const metadata: Metadata = { title: "Diff" };

export default function Page() {
  return <DiffWorkspace />;
}
