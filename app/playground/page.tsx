import type { Metadata } from "next";
import { PlaygroundWorkspace } from "@/app/playground/workspace";

export const metadata: Metadata = { title: "jq and grep" };

export default function Page() {
  return <PlaygroundWorkspace />;
}
