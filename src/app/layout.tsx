import type { Metadata, Viewport } from "next";
import "./globals.css";

/** Mobil notch / home indicator: fon to‘liq ekran, status bar ostida oq bo‘shliq kamayadi */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "ExpertLine — mutaxassislarni toping, xavfsiz muloqot",
  description:
    "Mutaxassislar uchun ish prostori, mijozlar uchun qulay kirish: jonli dars, maslahat, chat, kanallar va to'lovlar bitta platformada.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

import { SocketProvider } from "@/context/SocketContext";
import ClientShell from "./ClientShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="antialiased">
        <SocketProvider>
          <ClientShell>{children}</ClientShell>
        </SocketProvider>
      </body>
    </html>
  );
}

