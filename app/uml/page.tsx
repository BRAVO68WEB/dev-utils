import type { Metadata } from "next";
import { UmlWorkspace } from "@/app/uml/workspace";

export const metadata: Metadata = { title: "UML" };

export default function Page() {
  return <UmlWorkspace />;
}
