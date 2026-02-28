import React, { useState, useEffect } from 'react';
import { Award, Clock, DollarSign, Globe, Briefcase, GraduationCap, Building2, MapPin, X, Check, MessageSquare, Video, ShieldCheck, Search, Filter, Monitor, Map, Plus, ChevronRight, Gavel, HeartPulse, Wrench, Zap, Hammer, Camera, Car, Calculator, Stethoscope, User } from 'lucide-react';

import { GlassCard } from '../ui/GlassCard';
import JobForms from './JobForms';

const CATEGORY_ICONS: Record<string, any> = {
    'Gavel': Gavel,
    'HeartPulse': HeartPulse,
    'GraduationCap': GraduationCap,
    'Wrench': Wrench,
    'Zap': Zap,
    'Hammer': Hammer,
    'Camera': Camera,
    'Car': Car,
    'Calculator': Calculator,
    'Stethoscope': Stethoscope
};

const FeaturedExpertsBanner = ({ experts, onExpertClick }: { experts: any[], onExpertClick: (expert: any) => void }) => {
    if (experts.length === 0) return null;

    return (
        <div className="mb-8 overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Saralangan Mutaxassislar</h3>
                </div>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                    <div className="w-6 h-1.5 rounded-full bg-blue-600"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
                {experts.map((exp) => (
                    <div
                        key={exp.id}
                        onClick={() => onExpertClick(exp)}
                        className="min-w-[280px] md:min-w-[320px] bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-white/10 rounded-[32px] p-6 snap-center cursor-pointer hover:border-blue-500/40 transition-all group relative overflow-hidden active:scale-95"
                    >
                        {/* Decorative background element */}
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>

                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 p-1 flex-shrink-0">
                                {exp.avatar_url ? (
                                    <img src={exp.avatar_url} className="w-full h-full object-cover rounded-[14px]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-indigo-500/20 rounded-[14px]">{exp.name?.[0]}</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{exp.name} {exp.surname}</h4>
                                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest truncate">{exp.profession}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-1 rounded-full bg-amber-500"></div>)}
                                    </div>
                                    <span className="text-[10px] text-white/40 font-bold uppercase">Mustasno</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white/60">
                                {exp.experience_years} yil tajriba
                            </div>
                            <div className="text-emerald-400 font-black text-sm">
                                {Number(exp.service_price || 0) || Number(exp.hourly_rate || 0) || 0} <span className="text-[10px] opacity-60">MALI</span>
                            </div>
                        </div>

                        {/* Banner badge */}
                        <div className="absolute top-4 right-4 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-blue-600/40">
                            Top
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function ServicesList({ onStartChat, activeTab = 'jobs' }: { onStartChat?: (user: any) => void; activeTab?: 'experts' | 'jobs' }) {
    const [mainTab, setMainTab] = useState<'experts' | 'jobs'>(activeTab);

    // Sync internal state with prop
    useEffect(() => {
        setMainTab(activeTab);
    }, [activeTab]);
    const [experts, setExperts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [featuredExperts, setFeaturedExperts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [subType, setSubType] = useState<'seeker' | 'employer'>('seeker');
    const [loading, setLoading] = useState(false);
    const [selectedExpert, setSelectedExpert] = useState<any>(null);
    const [showJobForm, setShowJobForm] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/api/jobs/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchData = async (query = "") => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = '';

            if (mainTab === 'experts') {
                url = `${API_URL}/api/users/search?expert=true`;
                if (query) url += `&q=${encodeURIComponent(query)}`;
            } else {
                url = `${API_URL}/api/jobs?type=${isOnline ? 'online' : 'offline'}&sub_type=${subType}`;
                if (query) url += `&q=${encodeURIComponent(query)}`;
                if (selectedCategory) url += `&category_id=${selectedCategory}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExperts(data);
                if (!query && mainTab === 'experts') {
                    setFeaturedExperts(data.slice(0, 5));
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchData(searchQuery);
    }, [mainTab, isOnline, subType, selectedCategory]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(searchQuery);
    };

    const handleContact = (expert: any) => {
        if (onStartChat) onStartChat(expert);
        setSelectedExpert(null);
    };

    const handleBook = async (expert: any) => {
        setIsBooking(true);
        try {
            const token = localStorage.getItem('token');
            const amount = parseFloat(expert.hourly_rate || expert.service_price || '0');

            const res = await fetch(`${API_URL}/api/wallet/book`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ expertId: expert.id, amount })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setBookingSuccess(true);
                // Clear success message after 4 seconds
                setTimeout(() => {
                    setBookingSuccess(false);
                    setSelectedExpert(null);
                }, 4000);
            } else {

                alert(data.message || 'Xatolik yuz berdi. Balansingizni tekshiring.');
            }
        } catch (e) {
            console.error(e);
            alert('Tarmoq xatosi');
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative space-y-4">
            {/* Header / Search Component */}
            <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                        {mainTab === 'experts' ? <Briefcase className="h-6 w-6 text-blue-400" /> : <ShieldCheck className="h-6 w-6 text-blue-400" />}
                    </div>
                    <div>
                        <h2 className="text-white text-xl font-black uppercase tracking-tight">{mainTab === 'experts' ? 'Mutaxassislar' : (subType === 'seeker' ? 'Ish qidiruvchilar' : 'Ishchi kerak')}</h2>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{mainTab === 'experts' ? 'Verified Experts' : 'Job Board'}</p>
                    </div>
                </div>
            </div>

            {mainTab === 'jobs' && (
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 animate-fade-in">
                    <button
                        onClick={() => setIsOnline(true)}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isOnline ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        <Monitor className="h-4 w-4" /> Online Ishlar
                    </button>
                    <button
                        onClick={() => setIsOnline(false)}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!isOnline ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        <Map className="h-4 w-4" /> Offline (Joyda)
                    </button>
                </div>
            )}

            {/* Header / Search */}
            <GlassCard className="!p-3 flex flex-col md:flex-row gap-3 items-center sticky top-0 z-10 bg-[#1c242f]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="flex-1 w-full relative">
                    <form onSubmit={handleSearch}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ish yoki mutaxassis qidirish..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none placeholder-white/20 transition-all"
                        />
                    </form>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all">
                        <Filter className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setShowJobForm(true)}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-blue-500/30 transition-all hover:bg-blue-500 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> E'lon Berish
                    </button>
                </div>
            </GlassCard>

            {/* Categories Grid (Only for Jobs) */}
            {mainTab === 'jobs' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] opacity-40">Kategoriyalar</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-2 gap-3">
                        {categories.map((cat) => {
                            const Icon = CATEGORY_ICONS[cat.icon] || Briefcase;
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${isSelected ? 'bg-blue-600 border-blue-500 shadow-xl' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                >
                                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-white/5 group-hover:bg-blue-500/20'}`}>
                                        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[11px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>{cat.name_uz}</div>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-white/10'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Sub-type Tabs (Only for Jobs) */}
            {mainTab === 'jobs' && (
                <div className="flex gap-4 border-b border-white/5 animate-fade-in">
                    <button
                        onClick={() => setSubType('seeker')}
                        className={`pb-3 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${subType === 'seeker' ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Ish qidiryapman
                        {subType === 'seeker' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>}
                    </button>
                    <button
                        onClick={() => setSubType('employer')}
                        className={`pb-3 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${subType === 'employer' ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Ishchi kerak
                        {subType === 'employer' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>}
                    </button>
                </div>
            )}

            {/* Service List */}
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-60 text-white/40">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <p>E'lonlar izlanmoqda...</p>
                    </div>
                ) : (
                    <>
                        {/* Featured Experts Banner (Only for Experts or if not searching) */}
                        {mainTab === 'experts' && !searchQuery && <FeaturedExpertsBanner experts={featuredExperts} onExpertClick={(exp) => setSelectedExpert(exp)} />}

                        {experts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                                {experts.map(item => (
                                    <GlassCard
                                        key={item.id}
                                        hoverEffect={true}
                                        onClick={() => setSelectedExpert(item)}
                                        className="group cursor-pointer border border-white/5 bg-white/5 hover:border-blue-500/40 transition-all duration-300 relative overflow-hidden !p-0 rounded-[32px] animate-scale-up"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                                        {mainTab === 'experts' ? (
                                                            item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : <User className="h-7 w-7 text-blue-400" />
                                                        ) : (
                                                            item.sub_type === 'employer' ? <Building2 className="h-7 w-7 text-indigo-400" /> : <User className="h-7 w-7 text-blue-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-black text-sm uppercase tracking-tight">
                                                            {mainTab === 'experts' ? `${item.name} ${item.surname}` : (item.sub_type === 'employer' ? item.position : item.full_name)}
                                                        </h3>
                                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-0.5">
                                                            {mainTab === 'experts' ? item.profession : (item.sub_type === 'employer' ? item.company_name : item.position)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                                    {mainTab === 'experts' ? (item.verified_status || 'expert') : item.type}
                                                </div>
                                            </div>

                                            <p className="text-white/60 text-xs leading-relaxed line-clamp-2 italic mb-6">
                                                "{mainTab === 'experts' ? (item.bio_expert || item.specialty_desc || 'Tajribali mutaxassis.') : (item.short_text || (item.sub_type === 'seeker' ? `Men ${item.position} lavozimida ish qidirmoqdaman.` : `${item.company_name} kompaniyasiga ${item.position} kerak.`))}"
                                            </p>

                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-emerald-400" />
                                                    <span className="text-xs font-black text-emerald-400">
                                                        {mainTab === 'experts' ? (item.hourly_rate || item.service_price || 'Kelishilgan') : (item.sub_type === 'employer' ? (item.salary_text || 'Kelishilgan') : (item.salary_min ? `${Number(item.salary_min).toLocaleString()} so'm` : 'Kelishilgan'))}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/20">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="text-[10px] uppercase font-bold tracking-tighter">
                                                        {mainTab === 'experts' ? (item.wiloyat || 'Masofaviy') : (item.location || 'Toshkent')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-white/20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Search className="h-16 w-16 mb-4 opacity-5" />
                                <p className="font-medium">Hozircha hech qanday e'lon topilmadi</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showJobForm && (
                <JobForms
                    subType={subType}
                    categories={categories}
                    onClose={() => setShowJobForm(false)}
                    onSuccess={() => {
                        setShowJobForm(false);
                        fetchData();
                    }}
                />
            )}

            {/* DETAIL MODAL */}
            {selectedExpert && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setSelectedExpert(null)}>
                    <GlassCard className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto bg-[#1c242f] rounded-[32px] !p-0 shadow-3xl border border-white/10 animate-scale-up no-scrollbar" onClick={e => e.stopPropagation()}>
                        <div className="relative h-48 bg-gradient-to-br from-blue-600/40 to-indigo-600/40 p-8 flex items-end">
                            <button onClick={() => setSelectedExpert(null)} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-md">
                                <X className="h-6 w-6" />
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-3xl bg-white/10 border-4 border-[#1c242f] shadow-2xl overflow-hidden backdrop-blur-md flex items-center justify-center">
                                    {mainTab === 'experts' ? (
                                        selectedExpert.avatar_url ? <img src={selectedExpert.avatar_url} className="w-full h-full object-cover" /> : <User className="h-12 w-12 text-white/40" />
                                    ) : (
                                        selectedExpert.sub_type === 'employer' ? <Building2 className="h-12 w-12 text-white/40" /> : <User className="h-12 w-12 text-white/40" />
                                    )}
                                </div>
                                <div className="pb-1">
                                    <h2 className="text-white text-2xl font-black">
                                        {mainTab === 'experts' ? `${selectedExpert.name} ${selectedExpert.surname}` : (selectedExpert.sub_type === 'employer' ? selectedExpert.company_name : selectedExpert.full_name)}
                                    </h2>
                                    <span className="text-blue-300 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mt-1">
                                        {mainTab === 'experts' ? selectedExpert.profession : selectedExpert.position}
                                        <ShieldCheck className="h-4 w-4" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                                    <div className="text-white font-black text-sm">
                                        {mainTab === 'experts' ? (selectedExpert.hourly_rate || selectedExpert.service_price || 'Kelishilgan') : (selectedExpert.sub_type === 'employer' ? (selectedExpert.salary_text) : (selectedExpert.salary_min ? `${Number(selectedExpert.salary_min).toLocaleString()} so'm` : 'Kelishilgan'))}
                                    </div>
                                    <div className="text-white/20 text-[10px] font-bold uppercase tracking-wider mt-1">Maosh/Narx / soat</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <MapPin className="h-5 w-5 text-indigo-400 mx-auto mb-2" />
                                    <div className="text-white font-black text-xs truncate max-w-full px-1">
                                        {mainTab === 'experts' ? (selectedExpert.wiloyat || 'Masofaviy') : (selectedExpert.location || 'Toshkent')}
                                    </div>
                                    <div className="text-white/20 text-[10px] font-bold uppercase tracking-wider mt-1">Manzil</div>
                                </div>
                            </div>

                            {/* Info Sections */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 text-blue-400">
                                        <Briefcase className="h-4 w-4" />
                                        {mainTab === 'experts' ? 'Mutaxassis haqida' : (selectedExpert.sub_type === 'employer' ? 'Ish haqida' : 'O\'zim haqimda')}
                                    </h4>
                                    <p className="text-white/70 text-sm leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5 italic">
                                        "{mainTab === 'experts'
                                            ? (selectedExpert.bio_expert || selectedExpert.specialty_desc || 'Ma\'lumot berilmagan.')
                                            : (selectedExpert.short_text || 'Ma\'lumot berilmagan.')}"
                                    </p>
                                </div>

                                {mainTab === 'experts' ? (
                                    <div className="space-y-4">
                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/40 text-[10px] uppercase font-black">Tajriba</span>
                                                <span className="text-white text-xs font-bold">{selectedExpert.experience_years} yil</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/40 text-[10px] uppercase font-black">Mutaxassislik</span>
                                                <span className="text-blue-400 text-xs font-bold">{selectedExpert.specialization || 'Umumiy'}</span>
                                            </div>
                                            {selectedExpert.languages && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/40 text-[10px] uppercase font-black">Tillar</span>
                                                    <span className="text-white text-xs font-bold">{selectedExpert.languages}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    selectedExpert.sub_type === 'employer' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="text-white/20 text-[8px] font-black uppercase mb-1">Ish turi</div>
                                                <div className="text-white text-xs font-bold">{selectedExpert.work_type || 'Full-time'}</div>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="text-white/20 text-[8px] font-black uppercase mb-1">Ish vaqti</div>
                                                <div className="text-white text-xs font-bold">{selectedExpert.work_hours || '9:00 - 18:00'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="text-white/20 text-[8px] font-black uppercase mb-1">Tajriba</div>
                                                <div className="text-white text-xs font-bold">{selectedExpert.experience_years} yil</div>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="text-white/20 text-[8px] font-black uppercase mb-1">Tug'ilgan sana</div>
                                                <div className="text-white text-xs font-bold">{selectedExpert.birth_date ? new Date(selectedExpert.birth_date).toLocaleDateString() : 'Keltirilmagan'}</div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex flex-col gap-3">
                                {mainTab === 'experts' && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleBook(selectedExpert)}
                                            disabled={isBooking || bookingSuccess}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <DollarSign className="h-5 w-5" />
                                            {isBooking ? 'Kafillanmoqda...' : (bookingSuccess ? "So'rov Yuborildi" : "Darsga yozilish (Kafillash)")}
                                        </button>

                                        {bookingSuccess && (
                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-fade-in mb-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                    <Check className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="text-emerald-400 text-[11px] font-bold leading-tight">
                                                    Mentorga so'rov yuborildi. <br />
                                                    MALI kafillikda (escrow) saqlanmoqda.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}


                                <div className="flex gap-3">
                                    <button onClick={() => handleContact(selectedExpert)} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3">
                                        <MessageSquare className="h-5 w-5" />
                                        {mainTab === 'experts' ? 'Mutaxassis bilan bog\'lanish' : 'Bog\'lanish'}
                                    </button>
                                    <button onClick={() => setSelectedExpert(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all">
                                        Yopish
                                    </button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}

