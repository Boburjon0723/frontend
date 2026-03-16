"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface ClientShellProps {
  children: React.ReactNode;
}

export default function ClientShell({ children }: ClientShellProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="min-h-screen animate-fade-in motion-safe:duration-300 motion-safe:ease-out"
    >
      {children}
    </div>
  );
}

