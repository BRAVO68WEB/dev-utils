import type { Metadata } from "next";
import { SandboxWorkspace } from "@/app/sandbox/workspace";

export const metadata: Metadata = { title: "JS sandbox" };

export default function Page() {
  return <SandboxWorkspace />;
}
