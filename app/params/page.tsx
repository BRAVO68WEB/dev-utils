import type { Metadata } from "next";
import { ParamsWorkspace } from "@/app/params/workspace";

export const metadata: Metadata = { title: "URL params" };

export default function Page() {
  return <ParamsWorkspace />;
}
