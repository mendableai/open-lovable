import "./globals.css";
import { Inter } from "next/font/google";
import { Suspense } from "react"; // <-- add this
import DiagnosticsPanel from '@/components/DiagnosticsPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>   {/* <-- wrap children */}
          {children}
        </Suspense>
        <DiagnosticsPanel />
      </body>
    </html>
  );
}
