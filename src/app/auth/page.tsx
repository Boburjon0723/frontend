"use client";

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'next/navigation';

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
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1);
    const router = useRouter();

    // Form Stats
    const [countryCode, setCountryCode] = useState('+998');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [age, setAge] = useState('');

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

        if (!phone || !password || !confirmPassword) {
            setError('Please fill all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match");
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
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url("/auth-bg.png")', // User provided premium fibers background
                    filter: 'brightness(0.6)'
                }}
            ></div>

            <div className="relative z-10 w-full max-w-md">
                <GlassCard className="!p-8 backdrop-blur-3xl bg-black/40 border-white/10 shadow-2xl animate-slide-up">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {isLogin ? 'Xush Kelibsiz' : 'Ro\'yxatdan o\'tish'}
                        </h1>
                        <p className="text-white/60">
                            {isLogin ? 'MessenjrAli - Hisobingizga kiring' : step === 1 ? '1-qadam: Asosiy ma\'lumotlar' : '2-qadam: Shaxsiy ma\'lumotlar'}
                        </p>
                    </div>

                    {/* Tabs */}
                    {step === 1 && (
                        <div className="flex p-1 bg-white/10 rounded-xl mb-8">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                            >
                                Kirish
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                            >
                                Ro'yxatdan o'tish
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    {isLogin && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Telefon raqam</label>
                                <div className="flex gap-2">
                                    <select
                                        value={countryCode}
                                        onChange={e => setCountryCode(e.target.value)}
                                        className="px-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all appearance-none cursor-pointer text-center font-mono w-[80px]"
                                        disabled={loading}
                                    >
                                        {COUNTRY_CODES.map(c => (
                                            <option key={c.country} value={c.code} className="text-black">
                                                {c.code}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setPhone(val);
                                        }}
                                        placeholder="90 123 45 67"
                                        className="flex-1 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all font-mono"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Parol</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Parolingizni kiriting"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all"
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-[var(--accent-purple-start)] to-[var(--accent-purple-end)] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(124,77,255,0.4)] hover:shadow-[0_0_30px_rgba(124,77,255,0.6)] hover:scale-[1.02] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Yuklanmoqda...' : 'Kirish'}
                            </button>
                        </form>
                    )}

                    {/* Registration Form - Step 1 */}
                    {!isLogin && step === 1 && (
                        <form onSubmit={handleRegisterStep1} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Telefon raqam</label>
                                <div className="flex gap-2">
                                    <select
                                        value={countryCode}
                                        onChange={e => setCountryCode(e.target.value)}
                                        className="px-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all appearance-none cursor-pointer text-center font-mono w-[80px]"
                                    >
                                        {COUNTRY_CODES.map(c => (
                                            <option key={c.country} value={c.code} className="text-black">
                                                {c.code}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setPhone(val);
                                        }}
                                        placeholder="90 123 45 67"
                                        className="flex-1 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Parol</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Parol o'ylab toping (kamida 6 ta belgi)"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Parolni tasdiqlang</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Parolni qayta kiriting"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-[var(--accent-purple-start)] to-[var(--accent-purple-end)] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(124,77,255,0.4)] hover:shadow-[0_0_30px_rgba(124,77,255,0.6)] hover:scale-[1.02] transition-all mt-4"
                            >
                                Keyingi
                            </button>
                        </form>
                    )}

                    {/* Registration Form - Step 2 */}
                    {!isLogin && step === 2 && (
                        <form onSubmit={handleRegisterFinal} className="space-y-4">
                            <div className="bg-white/5 p-3 rounded-xl mb-4 border border-white/5">
                                <p className="text-xs text-white/50 mb-1">Telefon</p>
                                <p className="text-white font-mono">{countryCode} {phone}</p>
                            </div>

                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Ism</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ismingiz"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Familiya</label>
                                <input
                                    type="text"
                                    value={surname}
                                    onChange={e => setSurname(e.target.value)}
                                    placeholder="Familiyangiz"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-1.5 ml-1">Yosh</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    placeholder="Yoshingiz"
                                    min="13"
                                    max="120"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-purple-start)] focus:bg-white/10 transition-all"
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                                    disabled={loading}
                                >
                                    Orqaga
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-3.5 bg-gradient-to-r from-[var(--accent-purple-start)] to-[var(--accent-purple-end)] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(124,77,255,0.4)] hover:shadow-[0_0_30px_rgba(124,77,255,0.6)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Yuklanmoqda...' : 'Yakunlash'}
                                </button>
                            </div>
                        </form>
                    )}

                </GlassCard>
            </div>
        </div>
    );
}