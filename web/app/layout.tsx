import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { cn } from "@/lib/utils";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthTopLoader } from "@/components/auth-top-loader";
import { SWRProvider } from "@/components/swr-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Absense",
  description: "Attendance Management System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={cn("min-h-screen bg-gray-50 text-gray-900", dmSans.variable, "font-sans")}
      >
        <NextTopLoader color="#059669" height={3} showSpinner={false} />
        <AuthProvider>
          <SWRProvider>
            <AuthTopLoader />
            {children}
          </SWRProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
