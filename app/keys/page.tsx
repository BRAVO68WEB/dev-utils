import type { Metadata } from "next";
import { KeysWorkspace } from "@/app/keys/workspace";

export const metadata: Metadata = { title: "Keypairs" };

export default function Page() {
  return <KeysWorkspace />;
}
