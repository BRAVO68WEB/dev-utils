import type { Metadata } from "next";
import { Base64Workspace } from "@/app/base64/workspace";

export const metadata: Metadata = { title: "Base64" };

export default function Page() {
  return <Base64Workspace />;
}
