"use client";

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'next/navigation';
import { Phone, User, Lock, ChevronRight, Globe, AtSign, Eye, EyeOff, Camera, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

// ✅ FIXED: Default API URL qo'shildi
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const COUNTRY_CODES = [
    { code: '+998', country: 'UZ', label: 'Uzbekistan' },
    { code: '+7', country: 'RU', label: 'Russia/Kazakhstan' },
    { code: '+1', country: 'US', label: 'USA' },
    { code: '+992', country: 'TJ', label: 'Tajikistan' },
    { code: '+996', country: 'KG', label: 'Kyrgyzstan' },
    { code: '+90', country: 'TR', label: 'Turkey' },
    { code: '+82', country: 'KR', label: 'South Korea' },
];

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(false);
    const [step, setStep] = useState(1);
    const router = useRouter();

    // Form Stats
    const [countryCode, setCountryCode] = useState('+998');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); // Added for UI completeness
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [age, setAge] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // ✅ ADDED: Loading state

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true); // ✅ ADDED

        const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
        console.log(`[AUTH] Attempting login. API_URL: ${API_URL}, Phone: ${fullPhone}`);

        try {
            // ✅ FIXED: API_URL ishlatildi
            console.log(`[AUTH] Fetching ${API_URL}/api/auth/login ...`);
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/messages');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err); // ✅ ADDED: Debug log
            setError('Serverga ulanib bo\'lmadi. Internet aloqangizni tekshiring va qayta urining.');
        } finally {
            setLoading(false); // ✅ ADDED
        }
    };

    const handleRegisterStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !surname || !phone || !password) {
            setError('Please fill all fields');
            return;
        }
        if (password.length < 6) { // ✅ ADDED: Password validation
            setError('Password must be at least 6 characters');
            return;
        }
        setStep(2);
    };

    const handleRegisterFinal = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true); // ✅ ADDED

        if (!name || !surname || !age) {
            setError('Please fill all fields');
            setLoading(false);
            return;
        }

        const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;

        try {
            // ✅ FIXED: API_URL ishlatildi
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: fullPhone,
                    password,
                    name,
                    surname,
                    age: parseInt(age)
                })
            });
            const data = await res.json();

            if (res.ok) {
                setIsLogin(true);
                setStep(1);
                setPassword('');
                setConfirmPassword('');
                alert("Registration successful! Please login.");
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err); // ✅ ADDED: Debug log
            setError('Serverga ulanib bo\'lmadi. Internet aloqangizni tekshiring va qayta urining.');
        } finally {
            setLoading(false); // ✅ ADDED
        }
    };
    return (
        <div className="min-h-screen relative flex bg-[#121B22] overflow-hidden">
            {/* LEFT SECTION (FORM) */}
            <div className="flex-1 lg:flex-[0.6] relative z-20 flex flex-col p-8 lg:p-12 xl:p-16 overflow-hidden">
                {/* Blur Overlay Transition */}
                <div className="absolute top-0 right-0 w-[45%] h-full bg-gradient-to-l from-transparent via-[#121B22]/40 to-transparent backdrop-blur-[60px] z-10 pointer-events-none lg:block hidden"></div>
                {/* Header Branding */}

                <div className="flex-1 flex flex-col justify-center max-w-[440px] mx-auto w-full relative z-30">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                            Welcome MessengerAli
                        </h1>
                    </div>
                    <div className="mb-12">
                        <p className="text-[15px] text-white/50 tracking-wide font-medium">
                            {isLogin ? 'New to here?' : 'Already A Member?'}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setStep(1); }}
                                className="ml-2 text-blue-400 font-bold hover:text-blue-300 transition-colors"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    {/* FORMS */}
                    <div className="space-y-4">
                        {isLogin ? (
                            /* LOGIN FORM */
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider transition-colors group-focus-within:text-blue-500">Phone</label>
                                        <div className="flex pt-6 pb-3 px-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                            <select
                                                value={countryCode}
                                                onChange={e => setCountryCode(e.target.value)}
                                                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold text-sm w-[60px]"
                                            >
                                                {COUNTRY_CODES.map(c => <option key={c.country} value={c.code} className="bg-[#121B22]">{c.code}</option>)}
                                            </select>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                                placeholder="90 123 45 67"
                                                className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm ml-2"
                                            />
                                            <Phone className="w-4 h-4 text-white/20 group-focus-within:text-blue-500" />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider transition-colors group-focus-within:text-blue-500">Password</label>
                                        <div className="flex pt-6 pb-3 px-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/20 hover:text-white transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-4 px-6 bg-blue-500 hover:bg-blue-600 shadow-xl shadow-blue-500/20 text-white font-bold rounded-full transition-all text-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Login'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* REGISTRATION FORM */
                            <div className="space-y-4">
                                {step === 1 ? (
                                    <form onSubmit={handleRegisterStep1} className="space-y-4 animate-in slide-in-from-right duration-500">
                                        <div className="flex gap-4">
                                            <div className="relative group flex-1">
                                                <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider transition-colors group-focus-within:text-blue-500">First name</label>
                                                <div className="flex pt-6 pb-3 px-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={e => setName(e.target.value)}
                                                        placeholder="Michał"
                                                        className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm"
                                                    />
                                                    <User className="w-4 h-4 text-white/20 group-focus-within:text-blue-500" />
                                                </div>
                                            </div>
                                            <div className="relative group flex-1">
                                                <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider transition-colors group-focus-within:text-blue-500">Last name</label>
                                                <div className="flex pt-6 pb-3 px-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                                    <input
                                                        type="text"
                                                        value={surname}
                                                        onChange={e => setSurname(e.target.value)}
                                                        placeholder="Masiak"
                                                        className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm"
                                                    />
                                                    <User className="w-4 h-4 text-white/20 group-focus-within:text-blue-500" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider transition-colors group-focus-within:text-blue-500">Phone</label>
                                            <div className="flex pt-6 pb-3 px-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                                <select
                                                    value={countryCode}
                                                    onChange={e => setCountryCode(e.target.value)}
                                                    className="bg-transparent text-white focus:outline-none cursor-pointer font-bold text-sm w-[60px]"
                                                >
                                                    {COUNTRY_CODES.map(c => <option key={c.country} value={c.code} className="bg-[#121B22]">{c.code}</option>)}
                                                </select>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="90 123 45 67"
                                                    className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm ml-2"
                                                />
                                                <Phone className="w-4 h-4 text-white/20 group-focus-within:text-blue-500" />
                                            </div>
                                        </div>

                                        <div className="relative group p-[2px] rounded-[18px] bg-gradient-to-r from-blue-500/50 to-purple-500/50">
                                            <div className="relative bg-[#121B22] rounded-[16px]">
                                                <label className="absolute left-4 top-3 text-[10px] font-bold text-blue-500 uppercase tracking-wider">Password</label>
                                                <div className="flex pt-6 pb-3 px-4">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm"
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/20 hover:text-white transition-colors">
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="submit"
                                                className="flex-1 py-4 px-6 bg-blue-500 hover:bg-blue-600 shadow-xl shadow-blue-500/20 text-white font-bold rounded-full transition-all text-sm"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleRegisterFinal} className="space-y-6 animate-in slide-in-from-right duration-500">
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 relative group">
                                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Registration Summary</p>
                                            <div className="space-y-1">
                                                <p className="text-white font-bold">{name} {surname}</p>
                                                <p className="text-white/40 text-xs font-mono">{phone}</p>
                                            </div>
                                            <button type="button" onClick={() => setStep(1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-xs hover:underline">Edit</button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider transition-colors group-focus-within:text-blue-500">Phone number</label>
                                                <div className="flex pt-6 pb-3 px-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                                    <select
                                                        value={countryCode}
                                                        onChange={e => setCountryCode(e.target.value)}
                                                        className="bg-transparent text-white focus:outline-none cursor-pointer font-bold text-sm w-[60px]"
                                                    >
                                                        {COUNTRY_CODES.map(c => <option key={c.country} value={c.code} className="bg-[#121B22]">{c.code}</option>)}
                                                    </select>
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="90 123 45 67"
                                                        className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm ml-2"
                                                    />
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <label className="absolute left-4 top-3 text-[10px] font-bold text-white/30 uppercase tracking-wider transition-colors group-focus-within:text-blue-500">Age</label>
                                                <div className="flex pt-6 pb-3 px-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all">
                                                    <input
                                                        type="number"
                                                        value={age}
                                                        onChange={e => setAge(e.target.value)}
                                                        placeholder="25"
                                                        className="flex-1 bg-transparent text-white focus:outline-none font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-5 bg-gradient-to-r from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/20 text-white font-bold rounded-full hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-50"
                                        >
                                            {loading ? 'Processing...' : 'Create account'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="mt-16 flex items-center justify-end">
                    <p className="text-[11px] text-white/10 font-bold tracking-widest uppercase">© 2026 MESSENJRALY PLATFORM</p>
                </div>
            </div>

            {/* RIGHT SECTION (IMAGE) */}
            <div className="hidden lg:block lg:flex-[0.4] relative overflow-hidden group">
                <div className="absolute inset-0">
                    <Image
                        src="/premium-bg.png"
                        alt="Landscape"
                        fill
                        className="object-cover transition-transform duration-10000 group-hover:scale-110"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#121B22]/40"></div>
                </div>

                {/* SVG Divider Curve */}
                <div className="absolute top-0 bottom-0 -left-px w-24 h-full pointer-events-none stroke-[#121B22]">
                    <svg className="w-full h-full" viewBox="0 0 100 1000" preserveAspectRatio="none">
                        <path
                            d="M0,0 Q50,250 10,500 Q50,750 0,1000 L0,0"
                            fill="#121B22"
                        />
                        <path
                            d="M0,0 Q50,250 10,500 Q50,750 0,1000"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            strokeOpacity="0.1"
                            strokeDasharray="4 4"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}
