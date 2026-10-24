import type { Metadata } from "next";
import { YamlWorkspace } from "@/app/yaml/workspace";

export const metadata: Metadata = { title: "YAML" };

export default function Page() {
  return <YamlWorkspace />;
}
