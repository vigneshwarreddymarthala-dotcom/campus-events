import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusEvents — Your College Event Hub",
  description: "Discover, register, and manage campus events. One tap to see what's on, one tap to be there.",
  openGraph: {
    title: "CampusEvents — Your College Event Hub",
    description: "Discover, register, and manage campus events. One tap to see what's on, one tap to be there.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CampusEvents — Your College Event Hub",
    description: "Discover, register, and manage campus events.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full bg-gray-50 text-gray-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
