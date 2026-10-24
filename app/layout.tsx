import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const geistSans = IBM_Plex_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "Dev Utils", template: "%s · Dev Utils" },
  description: "Local developer utilities. Your work stays in this browser.",
};

const themeBoot = `try{var t=localStorage.getItem("dev-utils:theme");if(t==="dark")t="dracula";if(t==="light"||t==="dracula")document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full">
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
