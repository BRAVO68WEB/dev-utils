import type { Metadata } from "next";
import { HttpWorkspace } from "@/app/http/workspace";

export const metadata: Metadata = { title: "HTTP" };

export default function Page() {
  return <HttpWorkspace />;
}
