"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, User, Calendar, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-production-ad05.up.railway.app";

const COUNTRY_CODES = [
  { code: "+998", country: "UZ", label: "Uzbekistan" },
  { code: "+7", country: "RU", label: "Russia/Kazakhstan" },
  { code: "+1", country: "US", label: "USA" },
  { code: "+992", country: "TJ", label: "Tajikistan" },
  { code: "+996", country: "KG", label: "Kyrgyzstan" },
  { code: "+90", country: "TR", label: "Turkey" },
  { code: "+82", country: "KR", label: "South Korea" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("+998");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !surname || !phone || !password || !confirmPassword || !age) {
      setError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Parol va tasdiqlash paroli bir xil emas.");
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge) || parsedAge < 12) {
      setError("Yoshni to'g'ri kiriting (12 dan katta).");
      return;
    }

    setLoading(true);

    const fullPhone = `${countryCode}${phone.replace(/\D/g, "")}`;

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          password,
          name,
          surname,
          age: parsedAge,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("redirecting");
        setTimeout(() => {
          router.push("/login?registered=1");
        }, 1500);
      } else {
        setError(data.message || "Ro'yxatdan o'tish muvaffaqiyatsiz bo'ldi.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        "Serverga ulanib bo'lmadi. Internet aloqangizni tekshiring va qayta urinib ko'ring."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] text-white flex items-start md:items-center justify-center relative overflow-hidden overflow-y-auto pb-safe">
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/platform-default-bg.png)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[8px] [-webkit-backdrop-filter:blur(8px)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_#1d4ed8_0,_transparent_50%),radial-gradient(circle_at_bottom,_#7c3aed_0,_transparent_55%)] opacity-35"
      />
      <div aria-hidden className="absolute inset-0 z-0 bg-gradient-to-br from-black/55 via-black/45 to-[#020617]/88" />

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-5xl px-4 py-6 sm:py-10 md:py-0">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.1fr] gap-10 md:gap-14 items-center">
          {/* Left side – branding */}
          <div className="space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-blue-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ExpertLine · ekspertlar va mijozlar</span>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                Yangi{" "}
                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  ExpertLine
                </span>{" "}
                hisobini yarating
              </h1>
              <p className="mt-4 text-sm md:text-base text-slate-300/80 max-w-md leading-relaxed">
                Bir martalik ro&apos;yxatdan o&apos;tish — mutaxassis sifatida mijoz qabul qiling yoki oddiy foydalanuvchi
                sifatida xizmatlardan foydalaning: xabarlar, guruhlar va jonli darslar.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3 text-xs text-slate-400/80">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full border border-slate-900 bg-gradient-to-br from-sky-500 to-indigo-500" />
                <div className="h-7 w-7 rounded-full border border-slate-900 bg-gradient-to-br from-emerald-400 to-cyan-500" />
                <div className="h-7 w-7 rounded-full border border-slate-900 bg-gradient-to-br from-fuchsia-500 to-rose-500" />
              </div>
              <span>Onlayn dars, maslahat, shaxsiy va guruh chatlari bir joyda.</span>
            </div>
          </div>

          {/* Right side – form */}
          <div className="relative animate-auth-enter-right">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-sky-500/60 via-indigo-500/40 to-fuchsia-500/40 opacity-60 blur-xl" />
            <div className="relative rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl px-4 py-6 sm:px-6 sm:py-7 md:px-7 md:py-8 shadow-2xl shadow-sky-900/40">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Ro&apos;yxatdan o&apos;tish
                </h2>
                <p className="mt-1 text-xs md:text-sm text-slate-400">
                  Shaxsiy ma&apos;lumotlaringizni kiriting va hisob yarating.
                </p>
              </div>

              {success && (
                <div
                  role="status"
                  className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200"
                >
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {success === "redirecting"
                      ? "Muvaffaqiyatli! Tizimga yo'naltirilmoqda..."
                      : success}
                  </span>
                  {success === "redirecting" && (
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin ml-1" />
                  )}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Ism
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ali"
                        disabled={loading || !!success}
                        className="flex-1 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-70"
                      />
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Familiya
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all">
                      <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Valiyev"
                        disabled={loading || !!success}
                        className="flex-1 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-70"
                      />
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Yosh
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="24"
                      disabled={loading || !!success}
                      className="flex-1 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-70"
                    />
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="pt-1 text-[10px] text-slate-400">
                    12 yoshdan katta bo&apos;lishingiz kerak.
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Telefon raqam
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={loading || !!success}
                      className="bg-transparent text-xs md:text-sm font-semibold text-white focus:outline-none w-[70px] disabled:opacity-70"
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
                      disabled={loading || !!success}
                      className="flex-1 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-70"
                    />
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <label className="text-xs font-medium text-slate-300">
                      Parol
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all min-w-0">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading || !!success}
                        className="flex-1 min-w-0 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-70"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="shrink-0 p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="pt-1 text-[10px] text-slate-400">
                      Kamida 6 ta belgi, harflar va raqamlar tavsiya etiladi.
                    </p>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <label className="text-xs font-medium text-slate-300">
                      Parolni tasdiqlash
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-sky-400/70 focus-within:bg-white/10 transition-all min-w-0">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading || !!success}
                        className="flex-1 min-w-0 bg-transparent text-xs md:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-70"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="shrink-0 p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400">
                    Allaqachon hisobingiz bormi?
                  </p>
                  <Link
                    href="/login"
                    className="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Tizimga kirish
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Yaratilmoqda...</span>
                    </>
                  ) : success ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Yo'naltirilmoqda...</span>
                    </>
                  ) : (
                    "Hisob yaratish"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

