import type { Metadata } from "next";
import { JwtWorkspace } from "@/app/jwt/workspace";

export const metadata: Metadata = { title: "JWT" };

export default function Page() {
  return <JwtWorkspace />;
}
