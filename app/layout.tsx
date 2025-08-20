import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Open Lovable - AI-Powered Website Builder",
  description: "Build beautiful websites instantly with AI. Chat with AI to create stunning React applications in seconds.",
  keywords: ["AI", "website builder", "React", "Tailwind CSS", "web development", "AI code generation"],
  authors: [{ name: "Firecrawl Team" }],
  openGraph: {
    title: "Open Lovable - AI-Powered Website Builder",
    description: "Build beautiful websites instantly with AI. Chat with AI to create stunning React applications in seconds.",
    type: "website",
    url: "https://open-lovable.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
