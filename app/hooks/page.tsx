import type { Metadata } from "next";
import { HooksWorkspace } from "@/app/hooks/workspace";

export const metadata: Metadata = { title: "Webhooks" };

export default function Page() {
  return <HooksWorkspace />;
}
