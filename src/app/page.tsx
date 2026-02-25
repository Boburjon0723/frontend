"use client";

import { GlassButton } from "@/components/ui/GlassButton";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    setShowContent(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#050505]">
      {/* Premium Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage: 'url("/welcome-bg.png")', // Approved premium background
          filter: 'brightness(0.7) contrast(1.1)'
        }}
      ></div>

      {/* Overlays for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/40 to-[#050505]"></div>
      <div className="absolute inset-0 z-10 backdrop-blur-[3px]"></div>

      {/* Content */}
      <div className={`relative z-20 text-center transition-all duration-1000 transform ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>

        {/* Premium Header Branding */}
        <div className="mb-10">
          <span className="text-[12px] text-blue-400/60 uppercase tracking-[1em] font-black pl-[1em]">
            Premium Connect
          </span>
        </div>

        <h1 className="text-7xl md:text-9xl font-black text-white mb-6 tracking-tighter">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">MessenjrAli</span>
        </h1>

        <p className="text-lg md:text-xl text-blue-100/60 font-medium mb-16 max-w-lg mx-auto leading-relaxed tracking-wide px-4">
          Chegarasiz muloqot va moliyaviy erkinlik <br className="hidden md:block" /> dunyosiga xush kelibsiz.
        </p>

        <Link href="/auth">
          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <GlassButton variant="primary" size="lg" className="relative px-16 py-5 text-xl font-bold bg-blue-600 hover:bg-blue-500 border-white/10 !rounded-2xl transition-all duration-300 transform active:scale-95">
              Boshlash
            </GlassButton>
          </div>
        </Link>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 text-white/20 text-[10px] uppercase tracking-[0.5em] font-bold">
        MessenjrAli Ecosystem • 2026
      </div>
    </div>
  );
}
