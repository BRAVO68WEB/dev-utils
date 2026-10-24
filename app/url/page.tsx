import type { Metadata } from "next";
import { UrlWorkspace } from "@/app/url/workspace";

export const metadata: Metadata = { title: "URL encode" };

export default function Page() {
  return <UrlWorkspace />;
}
