import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Morehouse Business Association Member Database | Black Youth Empowerment Network",
  description: "The official Morehouse Business Association membership portal. Connect with peers, find opportunities, and access resources.",
  icons: {
    icon: "/logo.jpg",
  },
  openGraph: {
    title: "Morehouse Business Association Member Database",
    description: "Connect, share, and grow with the Black Youth Empowerment Network.",
    url: "https://members.weareMorehouse Business Association.org",
    siteName: "Morehouse Business Association Membership",
    images: [
      {
        url: "/logo.jpg",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

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
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
