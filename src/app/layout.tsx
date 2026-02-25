import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MessenjrAli - Tez va xavfsiz muloqot hamda to'lovlar",
  description: "iOS-inspired communication and financial platform",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  }
};

import { SocketProvider } from "@/context/SocketContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="antialiased">
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
