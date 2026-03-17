import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  Star,
  MoreVertical,
  PanelRightOpen,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface ServicesListProps {
  onStartChat?: (user: any) => void;
  activeTab?: 'experts' | 'jobs';
  initialSelectedExpert?: any;
  onExpertSelect?: (expert: any) => void;
  /** O'ng panel yopilganda "Panelni ochish" tugmasini ko'rsatish uchun */
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://backend-production-ad05.up.railway.app';

export default function ServicesList({
  onStartChat,
  activeTab = 'experts',
  initialSelectedExpert,
  onExpertSelect,
  showRightPanel = true,
  onToggleRightPanel,
}: ServicesListProps) {
  const [experts, setExperts] = useState<any[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<any | null>(initialSelectedExpert ?? null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // initialSelectedExpert o'zgarganda sinxronlash
  useEffect(() => {
    if (initialSelectedExpert) {
      setSelectedExpert(initialSelectedExpert);
      onExpertSelect?.(initialSelectedExpert);
    }
  }, [initialSelectedExpert?.id]);

  // selectedExpert o'zgarganda parentga xabar
  useEffect(() => {
    if (selectedExpert) onExpertSelect?.(selectedExpert);
  }, [selectedExpert?.id]);

  // Ekspertlarni olish
  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let url = `${API_URL}/api/users/search?expert=true`;
        if (search) url += `&q=${encodeURIComponent(search)}`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        const approved = (data || []).filter(
          (e: any) => e.verified_status === 'approved'
        );
        setExperts(approved);
        if (!selectedExpert && approved.length > 0) {
          setSelectedExpert(approved[0]);
        }
      } catch (e) {
        console.error('fetch experts error', e);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'experts') fetchExperts();
  }, [activeTab, search]);

  if (activeTab !== 'experts') return null;

  const hourly =
    selectedExpert?.hourly_rate ||
    selectedExpert?.service_price ||
    selectedExpert?.price ||
    0;

  return (
    <div className="flex flex-col h-full gap-4 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-400/40 flex items-center justify-center">
            <Award className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-white text-xl font-black uppercase tracking-tight">
              Mutaxassislar
            </h2>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
              Verified Experts
            </p>
          </div>
        </div>
        {/* O'ng panel yopilganda ochish tugmasi – "Mutaxassislar" sarlavhasining o'ngida */}
        {selectedExpert && !showRightPanel && onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/30 border border-emerald-400/40 hover:bg-emerald-500/50 text-emerald-300 font-medium text-sm transition-all"
            title="O'ng panelni ochish"
          >
            <PanelRightOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Panel</span>
          </button>
        )}
      </div>

      {/* Qidirish */}
      <GlassCard className="!p-3 flex items-center gap-3 bg-white/10 border-white/15">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki mutaxassis qidirish..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-blue-500 outline-none"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          Yuklanmoqda...
        </div>
      ) : !selectedExpert ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          Tasdiqlangan mutaxassis topilmadi
        </div>
      ) : (
        <>
          {/* Asosiy karta – scroll qiluvchi */}
          <GlassCard className="flex-1 min-h-0 flex flex-col !p-0 overflow-hidden rounded-[24px] bg-white/10 border-white/20 shadow-2xl">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {/* Profile banner: avatar chapda, ma'lumot o'ngda, 3 nuqta */}
            <div className="relative flex items-center gap-4 p-6 border-b border-white/10 bg-white/5">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 ring-2 ring-white/20">
                <img
                  src={
                    selectedExpert.avatar_url ||
                    selectedExpert.avatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
                  }
                  alt={selectedExpert.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-lg font-bold leading-tight truncate">
                  {selectedExpert.name} {selectedExpert.surname}
                </h2>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mt-0.5">
                  {selectedExpert.profession || 'Mutaxassis'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i <= Math.round(Number(selectedExpert.rating || 4.9)) ? 'fill-amber-400 text-amber-400' : 'fill-white/20 text-white/20'}`}
                      />
                    ))}
                  </div>
                  <span className="text-amber-300 text-xs font-semibold">
                    {Number(selectedExpert.rating || 4.9).toFixed(1)}
                  </span>
                  <span className="text-white/60 text-xs">
                    {(selectedExpert.experience_years || 0)} yil tajriba
                  </span>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all shrink-0">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            {/* Tanasi */}
            <div className="p-6 space-y-4 bg-white/5">
              {/* 1 maslahat = X MALI */}
              <div className="px-4 py-3 rounded-2xl bg-black/30 border border-white/10 text-sm text-white/90">
                <span className="font-semibold">1 maslahat</span> ={' '}
                <span className="text-emerald-300 font-bold">
                  {hourly || 'Kelishilgan'} MALI
                </span>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <p className="text-white/80 text-sm leading-relaxed">
                  {selectedExpert.bio_expert ||
                    selectedExpert.specialty_desc ||
                    `Men ${selectedExpert.profession || 'mutaxassis'}man.`}
                </p>
                <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                  <li>Online darslar</li>
                  <li>Imtihonga tayyorlash</li>
                  <li>Individual yondashuv</li>
                </ul>
              </div>

              {/* Pastki bo‘lim – darslar */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <h4 className="text-white/70 text-xs font-black uppercase tracking-[0.25em]">
                  Darslar
                </h4>
                <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                  <li>
                    Men {selectedExpert.profession || 'mutaxassislik'} bo‘yicha
                    dars beraman
                  </li>
                  <li>Online / masofaviy format</li>
                  <li>Imtihonga tayyorlash va nazorat ishlari</li>
                </ul>
              </div>
            </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}