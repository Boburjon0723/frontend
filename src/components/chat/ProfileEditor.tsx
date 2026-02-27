import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { useSocket } from '@/context/SocketContext';

interface ProfileEditorProps {
    onClose: () => void;
    onSave: (data: any) => void;
}

const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1000&auto=format&fit=crop",
];

export default function ProfileEditor({ onClose, onSave }: ProfileEditorProps) {
    const { socket } = useSocket();

    // Basic Info
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [birthday, setBirthday] = useState("");
    const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
    const [wiloyat, setWiloyat] = useState("");
    const [tuman, setTuman] = useState("");

    // Expert Info
    const [isExpert, setIsExpert] = useState(false);
    const [profession, setProfession] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [experience, setExperience] = useState<number>(0);
    const [price, setPrice] = useState<number>(0);
    const [hours, setHours] = useState("");
    const [languages, setLanguages] = useState("");

    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.name) setName(user.name);
        if (user.username) setUsername(user.username);
        if (user.bio) setBio(user.bio);
        if (user.birthday) {
            // Robust parsing for various date formats
            try {
                const date = new Date(user.birthday);
                if (!isNaN(date.getTime())) {
                    // Force format to YYYY-MM-DD for HTML5 date input
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    setBirthday(`${y}-${m}-${d}`);
                }
            } catch (e) {
                console.error("Birthday parse error:", e);
            }
        }
        if (user.avatar || user.avatar_url) setAvatar(user.avatar || user.avatar_url);
        if (user.wiloyat) setWiloyat(user.wiloyat);
        if (user.tuman) setTuman(user.tuman);

        // Expert fields
        if (user.is_expert) setIsExpert(true);
        if (user.profession) setProfession(user.profession);
        if (user.specialization) setSpecialization(user.specialization);
        if (user.experience_years) setExperience(user.experience_years);
        if (user.service_price) setPrice(user.service_price);
        if (user.working_hours) setHours(user.working_hours);
        if (user.languages) setLanguages(user.languages);
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('profile_updated', (data: any) => {
            const oldUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...oldUser, ...data }));
            onSave(data);
        });
        return () => { socket.off('profile_updated'); };
    }, [socket, onSave]);

    const handleSave = async () => {
        // Strip @ from username if present
        const cleanUsername = username.startsWith('@') ? username.substring(1) : username;

        const payload = {
            name,
            username: cleanUsername,
            bio,
            birthday,
            avatar_url: avatar,
            is_expert: isExpert,
            profession,
            specialization,
            experience_years: experience,
            service_price: price,
            working_hours: hours,
            languages,
            wiloyat,
            tuman
        };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedData = { ...payload, avatar: avatar }; // Ensure consistent field name
                const oldUser = JSON.parse(localStorage.getItem('user') || '{}');
                const newUser = { ...oldUser, ...updatedData };
                localStorage.setItem('user', JSON.stringify(newUser));
                onSave(newUser); // Close modal
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to update profile');
            }
        } catch (e: any) {
            console.error('Profile update error:', e);
            alert('Error updating profile: ' + (e.message || 'Network error'));
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setAvatar(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
            <GlassCard
                className="w-full max-w-md !p-0 overflow-hidden relative shadow-2xl animate-scale-in z-10 !bg-[#353940]/90 !backdrop-blur-3xl border border-white/10 flex flex-col max-h-[90vh] rounded-[30px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
                    <button onClick={onClose} className="text-[#94a3b8] hover:text-white transition-colors">Cancel</button>
                    <h2 className="text-white font-bold">Edit Profile</h2>
                    <button onClick={handleSave} className="text-[#3b82f6] font-medium hover:text-[#60a5fa] transition-colors">Done</button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-5 pb-8 space-y-6">

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div
                                className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-blue-400 to-purple-500 cursor-pointer overflow-hidden"
                                onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                            >
                                <img src={avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-[#0f172a]" />
                            </div>
                            <div
                                className="absolute -bottom-1 -right-1 bg-[#3b82f6] p-2 rounded-full text-white cursor-pointer hover:bg-blue-600 shadow-lg border-2 border-[#0f172a]"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload from Gallery"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>
                        {showAvatarSelector && (
                            <div className="mt-4 flex gap-3 animate-fade-in px-2 overflow-x-auto w-full justify-center custom-scrollbar pb-2">
                                {PRESET_AVATARS.map((url, i) => (
                                    <button key={i} onClick={() => { setAvatar(url); setShowAvatarSelector(false); }} className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 flex-shrink-0 ${avatar === url ? 'border-[#3b82f6]' : 'border-white/10'}`}>
                                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-[#3b82f6] text-xs font-medium mt-3">Edit Picture</p>
                    </div>

                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Display Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none transition-colors" placeholder="Your Name" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Username</label>
                                <span className="text-white/30 text-xs">@{username}</span>
                            </div>
                            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none transition-colors" placeholder="username" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Birthday</label>
                            <input
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Bio</label>
                            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none transition-colors resize-none" placeholder="Tell us about yourself..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Viloyat</label>
                                <select
                                    value={wiloyat}
                                    onChange={(e) => setWiloyat(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none transition-colors"
                                >
                                    <option value="">Tanlang</option>
                                    <option value="Toshkent">Toshkent</option>
                                    <option value="Andijon">Andijon</option>
                                    <option value="Buxoro">Buxoro</option>
                                    <option value="Farg'ona">Farg'ona</option>
                                    <option value="Jizzax">Jizzax</option>
                                    <option value="Xorazm">Xorazm</option>
                                    <option value="Namangan">Namangan</option>
                                    <option value="Navoiy">Navoiy</option>
                                    <option value="Qashqadaryo">Qashqadaryo</option>
                                    <option value="Samarqand">Samarqand</option>
                                    <option value="Sirdaryo">Sirdaryo</option>
                                    <option value="Surxondaryo">Surxondaryo</option>
                                    <option value="Qoraqalpog'iston">Qoraqalpog'iston</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Tuman / Shahar</label>
                                <input value={tuman} onChange={(e) => setTuman(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none transition-colors" placeholder="Tuman nomi" />
                            </div>
                        </div>
                    </div>

                    {/* Section: Expert Mode Toggle */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold">Expert Mode</h3>
                            <p className="text-[#94a3b8] text-xs">Offer services and display professional details</p>
                        </div>
                        <button
                            onClick={() => setIsExpert(!isExpert)}
                            className={`w-12 h-7 rounded-full transition-colors relative ${isExpert ? 'bg-green-500' : 'bg-white/10'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${isExpert ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* Expert Fields (Conditional) */}
                    {isExpert && (
                        <div className="space-y-4 animate-fade-in-up border-t border-white/10 pt-4">
                            <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider">Expert Details</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Profession</label>
                                    <input value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none" placeholder="e.g. Lawyer" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Experience (Yrs)</label>
                                    <input type="number" value={experience} onChange={(e) => setExperience(parseInt(e.target.value) || 0)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Specialization</label>
                                <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none" placeholder="e.g. Criminal Law, Family Law (comma separated)" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Price (MALI/hr)</label>
                                    <input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Working Hours</label>
                                    <input value={hours} onChange={(e) => setHours(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none" placeholder="e.g. 9AM - 6PM" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[#94a3b8] text-xs uppercase font-bold tracking-wider ml-1">Languages</label>
                                <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3b82f6] focus:outline-none" placeholder="e.g. English, Uzbek, Russian" />
                            </div>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}

