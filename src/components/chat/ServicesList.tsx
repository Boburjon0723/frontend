import React, { useState, useEffect } from 'react';
import {
  Star,
  MoreVertical,
  PanelRightOpen,
  MessageCircle,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import {
  countExpertGroups,
  formatExpertPublicPrice,
  formatServiceFormatLabel,
  getExpertActionType,
  getExpertListingPitch,
  getExpertSpecialtyLine,
} from '@/lib/expert-roles';
import { getClientServiceTerms } from '@/lib/client-service-terms';

interface ServicesListProps {
  onStartChat?: (user: any) => void;
  activeTab?: 'experts' | 'jobs';
  /** Chap paneldagi ro'yxatdan tanlangan ekspert — faqat shu ma'lumot ko'rsatiladi */
  initialSelectedExpert?: any;
  onExpertSelect?: (expert: any) => void;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
}

export default function ServicesList({
  onStartChat,
  activeTab = 'experts',
  initialSelectedExpert,
  onExpertSelect,
  showRightPanel = true,
  onToggleRightPanel,
}: ServicesListProps) {
  const [selectedExpert, setSelectedExpert] = useState<any | null>(
    initialSelectedExpert ?? null
  );
  const [showUseTermsModal, setShowUseTermsModal] = useState(false);

  useEffect(() => {
    const next = initialSelectedExpert ?? null;
    setSelectedExpert(next);
    setShowUseTermsModal(false);
    if (next) onExpertSelect?.(next);
  }, [initialSelectedExpert?.id]);

  if (activeTab !== 'experts') return null;

  const priceBlock = selectedExpert
    ? formatExpertPublicPrice(selectedExpert)
    : { line: '', isSession: false };

  const isMentorCard =
    !!selectedExpert && getExpertActionType(selectedExpert) === 'mentor';

  const clientTerms = selectedExpert
    ? getClientServiceTerms(getExpertActionType(selectedExpert))
    : null;

  const specialtyLine = selectedExpert
    ? getExpertSpecialtyLine(selectedExpert)
    : '';
  const listingPitch = selectedExpert
    ? getExpertListingPitch(selectedExpert)
    : '';
  const defaultListingLine = selectedExpert
    ? `Men ${selectedExpert.profession || 'mutaxassis'}man. Savolingizni chat orqali yuboring.`
    : '';
  const groupCount = selectedExpert
    ? countExpertGroups(selectedExpert.expert_groups)
    : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full gap-3 overflow-hidden">
      {selectedExpert && !showRightPanel && onToggleRightPanel && (
        // Mobile’da o‘ng panel ko‘rinmaydi, shuning uchun shu tugmani ham yashiramiz
        <div className="hidden lg:flex justify-end shrink-0 px-1">
          <button
            onClick={onToggleRightPanel}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/30 border border-emerald-400/40 hover:bg-emerald-500/50 text-emerald-300 font-medium text-sm transition-all"
            title="O'ng panelni ochish"
          >
            <PanelRightOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Panel</span>
          </button>
        </div>
      )}

      {!selectedExpert ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-white/45">
          <p className="text-sm max-w-sm leading-relaxed">
            Chap paneldagi ro&apos;yxatdan mutaxassis tanlang — kartani bosing. Shu yerda uning
            profili va e&apos;loni ochiladi.
          </p>
        </div>
      ) : (
        <GlassCard className="flex-1 min-h-0 flex flex-col !p-0 overflow-hidden rounded-[24px] bg-white/10 border-white/20 shadow-2xl">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain custom-scrollbar">
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
                {specialtyLine && (
                  <p className="text-white/55 text-[11px] mt-1 line-clamp-2 leading-snug">
                    {specialtyLine}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
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
              <button
                type="button"
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all shrink-0"
                aria-label="Qo‘shimcha"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white/5">
              <div className="px-4 py-3 rounded-2xl bg-black/30 border border-white/10 text-sm text-white/90">
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider block mb-1">
                  Narx
                </span>
                <span className="text-emerald-300 font-bold text-base">{priceBlock.line}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                  <span className="text-white/40 uppercase font-bold text-[9px] block">
                    Tajriba
                  </span>
                  <span className="text-white font-semibold">
                    {(selectedExpert.experience_years || 0)} yil
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                  <span className="text-white/40 uppercase font-bold text-[9px] block">
                    Format
                  </span>
                  <span className="text-white font-semibold">
                    {formatServiceFormatLabel(selectedExpert.service_format)}
                  </span>
                </div>
                {selectedExpert.service_languages && (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 col-span-2">
                    <span className="text-white/40 uppercase font-bold text-[9px] block">
                      Tillar
                    </span>
                    <span className="text-white font-semibold line-clamp-2">
                      {selectedExpert.service_languages}
                    </span>
                  </div>
                )}
                {isMentorCard && groupCount > 0 && (
                  <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 col-span-2">
                    <span className="text-white/40 uppercase font-bold text-[9px] block">
                      Guruhlar
                    </span>
                    <span className="text-white font-semibold">
                      {groupCount} ta jonli guruh / dars
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">
                  E&apos;lon
                </h4>
                <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
                  {listingPitch || defaultListingLine}
                </p>
                {(() => {
                  const bio = (selectedExpert.bio_expert || '').trim();
                  if (!bio || bio === listingPitch) return null;
                  return (
                    <p className="text-white/60 text-xs leading-relaxed border-t border-white/10 pt-2 whitespace-pre-wrap">
                      {bio}
                    </p>
                  );
                })()}
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <h4 className="text-white/70 text-xs font-black uppercase tracking-[0.25em]">
                  {isMentorCard ? 'Qanday ishlayman' : 'Qanday ulanish'}
                </h4>
                <ul className="list-disc list-inside text-sm text-white/75 space-y-1">
                  {isMentorCard ? (
                    <>
                      <li>Guruh va jonli darslar — chatdan yozilish</li>
                      <li>
                        {formatServiceFormatLabel(selectedExpert.service_format)} formatda
                        ta&apos;lim
                      </li>
                      <li>Individual yondashuv va materiallar</li>
                    </>
                  ) : (
                    <>
                      <li>Avval shaxsiy chat — keyin mutaxassis paneli orqali uchrashuv</li>
                      <li>
                        {priceBlock.isSession
                          ? 'Narx bitta seans/konsultatsiya uchun ko‘rsatilgan'
                          : 'Narx soat bo‘yicha ko‘rsatilgan'}
                      </li>
                      <li>Hujjatlar xavfsiz chat orqali yuboriladi</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Mobile: foydalanish shartlari bilan tanishish */}
              {clientTerms && selectedExpert && (
                <div className="lg:hidden mt-3">
                  <button
                    type="button"
                    onClick={() => setShowUseTermsModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm font-bold transition-all active:scale-[0.99]"
                  >
                    Foydalanish sharti bilan tanishish
                  </button>
                </div>
              )}

              {clientTerms && selectedExpert && showUseTermsModal && (
                <div
                  className="fixed inset-0 z-[220] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
                  onClick={() => setShowUseTermsModal(false)}
                >
                  <div
                    className="w-full max-w-md rounded-3xl bg-[#0f1419]/92 border border-white/10 shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                      <div className="text-white/90 font-bold text-sm">Foydalanish shartlari</div>
                      <button
                        type="button"
                        onClick={() => setShowUseTermsModal(false)}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-all"
                        aria-label="Yopish"
                      >
                        <span className="text-xl leading-none">×</span>
                      </button>
                    </div>

                    <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.08] px-3 py-3">
                        <h4 className="text-cyan-200 font-bold text-[11px] uppercase tracking-wider mb-2">
                          {clientTerms.paymentTitle}
                        </h4>
                        <ul className="list-disc list-inside space-y-1.5 text-white/80 text-sm">
                          {clientTerms.paymentLines.slice(0, 3).map((ln, i) => (
                            <li key={i}>{ln}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-blue-400/25 bg-blue-500/[0.08] px-3 py-3">
                        <h4 className="text-blue-200 font-bold text-[11px] uppercase tracking-wider mb-2">
                          {clientTerms.consultTitle}
                        </h4>
                        <ul className="list-disc list-inside space-y-1.5 text-white/80 text-sm">
                          {clientTerms.consultLines.slice(0, 3).map((ln, i) => (
                            <li key={i}>{ln}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 pt-2 border-t border-white/10 bg-black/20 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    selectedExpert &&
                    onStartChat?.({ ...selectedExpert, fromExpertListing: true })
                  }
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 border border-blue-400/30 text-white text-sm font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99]"
                >
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  {isMentorCard ? 'Chat — yozilish va dars' : 'Maslahat olish — chatni boshlash'}
                </button>
                <p className="text-[10px] text-white/45 text-center mt-2 leading-snug">
                  {isMentorCard
                    ? 'Suhbatdan keyin ustoz sizni guruhga taklif qilishi mumkin.'
                    : 'Sizning shaxsiy chattingiz ochiladi; mutaxassis javobidan keyin onlayn uchrashuvni davom ettirasiz.'}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
