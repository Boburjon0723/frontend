"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const COUNTRY_CODES = [
  { code: "+998", country: "UZ", label: "Uzbekistan" },
  { code: "+7", country: "RU", label: "Russia/Kazakhstan" },
  { code: "+1", country: "US", label: "USA" },
  { code: "+992", country: "TJ", label: "Tajikistan" },
  { code: "+996", country: "KG", label: "Kyrgyzstan" },
  { code: "+90", country: "TR", label: "Turkey" },
  { code: "+82", country: "KR", label: "South Korea" },
];

import { Suspense } from "react";

function Login() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("+998");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justRegistered, setJustRegistered] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("registered")) {
      setJustRegistered(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setJustRegistered(false);
    setLoading(true);

    if (!phone || !password) {
      setError("Telefon raqam va parolni kiriting.");
      setLoading(false);
      return;
    }

    const numericPhone = phone.replace(/\D/g, "");
    if (numericPhone.length < 9) {
      setError("Telefon raqamni to‘liq kiriting.");
      setLoading(false);
      return;
    }

    const fullPhone = `${countryCode}${numericPhone}`;

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token);
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        router.push("/messages");
      } else {
        setError(
          data.message || "Telefon raqam yoki parol noto'g'ri. Qayta urinib ko'ring."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Serverga ulanib bo'lmadi. Internet aloqangizni tekshiring va qayta urinib ko'ring."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-start md:items-center justify-center relative overflow-hidden overflow-y-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1d4ed8_0,_transparent_50%),radial-gradient(circle_at_bottom,_#7c3aed_0,_transparent_55%)] opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-[#020617]" />

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-4xl px-4 py-10 md:py-0">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 md:gap-14 items-center">
          {/* Left side – branding */}
          <div className="space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-blue-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>MessenjrAli</span>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                Chegarasiz muloqotga{" "}
                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  qaytish
                </span>
              </h1>
              <p className="mt-4 text-sm md:text-base text-slate-300/80 max-w-md leading-relaxed">
                Telefon raqamingiz bilan tizimga kiring va MessenjrAli ekotizimida
                do&apos;stlaringiz, hamkorlaringiz va mijozlaringiz bilan
                xavfsiz muloqotni davom ettiring.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3 text-xs text-slate-400/80">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full border border-slate-900 bg-gradient-to-br from-sky-500 to-indigo-500" />
                <div className="h-7 w-7 rounded-full border border-slate-900 bg-gradient-to-br from-emerald-400 to-cyan-500" />
                <div className="h-7 w-7 rounded-full border border-slate-900 bg-gradient-to-br from-fuchsia-500 to-rose-500" />
              </div>
              <span>Real-time xabarlar, qo&apos;ng&apos;iroqlar va kanallar bir joyda.</span>
            </div>
          </div>

          {/* Right side – form */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-sky-500/60 via-indigo-500/40 to-fuchsia-500/40 opacity-60 blur-xl" />
            <div className="relative rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-7 md:px-7 md:py-8 shadow-2xl shadow-sky-900/40">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Tizimga kirish
                </h2>
                <p className="mt-1 text-xs md:text-sm text-slate-400">
                  Hisobingizga telefon raqam va parol orqali kiring.
                </p>
              </div>

              {justRegistered && !error && (
                <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  Ro&apos;yxatdan o&apos;tish muvaffaqiyatli yakunlandi. Endi tizimga kiring.
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">
                    Telefon raqam
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-transparent text-xs md:text-sm font-semibold text-white focus:outline-none w-[70px]"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option
                          key={c.country}
                          value={c.code}
                          className="bg-slate-900 text-white"
                        >
                          {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="90 123 45 67"
                      className="flex-1 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">
                    Parol
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => alert("Tez orada: parolni tiklash funksiyasi qo'shiladi.")}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Parolni unutdingizmi?
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <p className="text-slate-400">
                      Hisobingiz yo&apos;qmi?{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/register")}
                        className="text-sky-400 hover:text-sky-300 font-medium ml-1"
                      >
                        Ro&apos;yxatdan o&apos;tish
                      </button>
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !phone ||
                    !password ||
                    phone.replace(/\D/g, "").length < 9
                  }
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Kiritilmoqda..." : "Kirish"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white animate-pulse">Yuklanmoqda...</div>
      </div>
    }>
      <Login />
    </Suspense>
  );
}

