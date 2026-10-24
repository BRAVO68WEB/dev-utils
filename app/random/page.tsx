import type { Metadata } from "next";
import { RandomWorkspace } from "@/app/random/workspace";

export const metadata: Metadata = { title: "Random" };

export default function Page() {
  return <RandomWorkspace />;
}
