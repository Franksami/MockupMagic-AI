import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex";
import { ReactQueryProvider } from "@/lib/react-query";
import { WhopProvider } from "@/components/providers/whop-provider";
import { AppShell } from "@/components/shell/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MockupMagic AI - Generate Stunning Mockups in Seconds",
  description: "Transform your designs into professional mockups using AI. Perfect for Whop sellers and digital creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <ReactQueryProvider>
            <WhopProvider>
              <AppShell>
                {children}
              </AppShell>
            </WhopProvider>
          </ReactQueryProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
