import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/lib/auth/privy-provider";
import { LivepeerProvider } from "@/lib/video/livepeer-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Full Court - Basketball Content Platform",
  description: "The ultimate basketball content platform for players, fans, and creators. Stream, watch, and engage with the game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProvider>
          <LivepeerProvider>
        {children}
          </LivepeerProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
