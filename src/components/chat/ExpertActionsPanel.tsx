"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageCircle, Lightbulb, GraduationCap, Wallet, Paperclip, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getExpertActionType, getExpertPanelMode } from '@/lib/expert-roles';
import { getExpertComplianceNotice } from '@/lib/expert-compliance-copy';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
const DEFAULT_MONTHLY_MALI = 100;

type ExpertGroupItem = { chatId?: string; id?: string; name?: string; time?: string };

interface ExpertActionsPanelProps {
  expert: any;
  onClose?: () => void;
  onStartChat?: (expert: any) => void;
  /** Hamyon (wallet) bo'limiga o'tkazish — "To'lov qilish" */
  onOpenWallet?: () => void;
  /** Guruhga qo'shilgandan keyin chatni ochish (URL o'rniga ishonchli) */
  onLessonJoined?: (groupId: string) => void | Promise<void>;
}

type ToastState = { type: 'success' | 'error' | 'warning'; message: string } | null;

export default function ExpertActionsPanel({
  expert,
  onClose,
  onStartChat,
  onOpenWallet,
  onLessonJoined,
}: ExpertActionsPanelProps) {
  const router = useRouter();
  const expertId = expert?.id ?? expert?._id;
  const [quickMessage, setQuickMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [pickableGroups, setPickableGroups] = useState<ExpertGroupItem[]>([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subAmount, setSubAmount] = useState(DEFAULT_MONTHLY_MALI);
  const [toast, setToast] = useState<ToastState>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subStatusLoading, setSubStatusLoading] = useState(false);
  const actionType = getExpertActionType(expert);
  const panelMode = getExpertPanelMode(expert);
  const clientCompliance = getExpertComplianceNotice(panelMode, 'client');

  const mentorName = expert?.name ? `${expert.name} ${expert.surname || ''}`.trim() : expert?.profession || 'Ustoz';

  const pushToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!expert) return;
    const rate = Number(expert.hourly_rate ?? expert.service_price);
    if (!Number.isNaN(rate) && rate > 0) {
      setSubAmount(Math.max(1, Math.round(rate)));
    } else {
      setSubAmount(DEFAULT_MONTHLY_MALI);
    }
  }, [expert?.id, expert?.hourly_rate, expert?.service_price]);

  useEffect(() => {
    if (!expertId || actionType !== 'mentor') {
      setHasActiveSubscription(false);
      return;
    }
    let cancelled = false;
    setSubStatusLoading(true);
    (async () => {
      try {
        const r = await apiFetch(
          `/api/wallet/subscription-status?mentorId=${encodeURIComponent(String(expertId))}`
        );
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled) setHasActiveSubscription(!!d.active);
      } catch {
        if (!cancelled) setHasActiveSubscription(false);
      } finally {
        if (!cancelled) setSubStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expertId, actionType]);

  const joinAndNavigate = useCallback(
    async (groupId: string) => {
      const joinRes = await apiFetch(`/api/chats/${groupId}/join-with-subscription`, { method: 'POST' });
      if (!joinRes.ok) {
        const err = await joinRes.json().catch(() => ({}));
        pushToast('error', (err as { message?: string })?.message || "Guruhga qo'shilishda xatolik");
        return;
      }
      pushToast('success', "Guruhga qo'shildingiz");
      if (onLessonJoined) {
        try {
          await onLessonJoined(groupId);
        } catch (e) {
          console.error(e);
          router.push(`/messages?openChat=${encodeURIComponent(groupId)}`);
        }
      } else {
        router.push(`/messages?openChat=${encodeURIComponent(groupId)}`);
      }
    },
    [pushToast, router, onLessonJoined]
  );

  const loadGroupsAndJoinOrPick = useCallback(async () => {
    if (!expertId) return;
    const groupsRes = await fetch(`${API_URL}/api/chats/expert/${expertId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!groupsRes.ok) {
      pushToast('error', "Guruhlar ro'yxatini yuklab bo'lmadi");
      return;
    }
    const groups: ExpertGroupItem[] = await groupsRes.json();
    if (!Array.isArray(groups) || groups.length === 0) {
      pushToast(
        'warning',
        "Ustoz hali dars guruhini ochmagan. Avval chat orqali bog'laning."
      );
      return;
    }
    if (groups.length === 1) {
      const gid = groups[0].chatId || groups[0].id;
      if (gid) await joinAndNavigate(String(gid));
      return;
    }
    setPickableGroups(groups);
    setShowGroupPicker(true);
  }, [expertId, joinAndNavigate, pushToast]);

  const handleDarsigaQoshilish = async () => {
    if (!expertId) {
      pushToast('error', "Ustoz ma'lumotlari topilmadi (id).");
      return;
    }
    if (actionType !== 'mentor') {
      pushToast('warning', 'Bu profil uchun darsga yozilish boshqa tartibda.');
      return;
    }
    setJoinLoading(true);
    try {
      const subRes = await apiFetch(
        `/api/wallet/subscription-status?mentorId=${encodeURIComponent(String(expertId))}`
      );
      if (!subRes.ok) {
        const err = await subRes.json().catch(() => ({}));
        pushToast('error', (err as { message?: string })?.message || "Obuna holatini tekshirib bo'lmadi");
        return;
      }
      const data = await subRes.json();
      setHasActiveSubscription(!!data.active);
      if (!data.active) {
        pushToast(
          'warning',
          "Avval «To'lov»ni bajaring. Mablag' muzlatiladi; 30 kundan keyin ustoz hisobiga o'tadi."
        );
        setShowPaymentModal(true);
        return;
      }
      await loadGroupsAndJoinOrPick();
    } catch (e) {
      console.error(e);
      pushToast('error', 'Tarmoq xatosi. Qayta urinib ko‘ring.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!expertId || subAmount <= 0) return;
    setSubscribing(true);
    try {
      const res = await apiFetch('/api/wallet/subscribe-to-mentor', {
        method: 'POST',
        body: JSON.stringify({ mentorId: expertId, amount: Number(subAmount) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPaymentModal(false);
        setHasActiveSubscription(true);
        setJoinLoading(true);
        try {
          await loadGroupsAndJoinOrPick();
        } finally {
          setJoinLoading(false);
        }
      } else {
        pushToast('error', data.message || 'Obunada xatolik');
      }
    } catch (e: unknown) {
      pushToast('error', e instanceof Error ? e.message : 'Obunada xatolik');
    } finally {
      setSubscribing(false);
    }
  };

  const handlePickGroup = async (g: ExpertGroupItem) => {
    const gid = g.chatId || g.id;
    if (!gid) return;
    setShowGroupPicker(false);
    setPickableGroups([]);
    setJoinLoading(true);
    try {
      await joinAndNavigate(String(gid));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleTolovQilish = () => {
    if (actionType === 'mentor') {
      if (hasActiveSubscription) {
        pushToast('warning', "Obuna allaqachon faol. Keyingi qadam: «2-bosqich: darsga qo'shilish».");
        return;
      }
      setShowPaymentModal(true);
      return;
    }
    if (actionType === 'consultant') {
      pushToast('warning', "Maslahat uchun yuqoridagi «Maslahat olish» tugmasidan foydalaning.");
      return;
    }
    onOpenWallet?.();
  };

  if (!expert) return null;

  return (
    <div className="fixed lg:relative inset-0 lg:inset-auto z-[70] lg:z-0 h-full w-full flex flex-col bg-[#788296]/25 lg:bg-transparent backdrop-blur-[20px] lg:backdrop-blur-none border-l-0 lg:border-l lg:border-white/20 overflow-hidden animate-slide-left select-none relative">
      <div className="lg:hidden absolute inset-0 bg-slate-900/40 -z-10" />

      {toast && (
        <div
          className={`absolute top-14 left-4 right-4 z-[85] flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-50'
              : toast.type === 'warning'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-50'
                : 'bg-red-500/15 border-red-500/40 text-red-50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span className="leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto text-white/60 hover:text-white p-0.5"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-4">
        {clientCompliance && (
          <div className="mx-4 mb-3 rounded-xl border border-amber-400/35 bg-amber-500/[0.11] px-3 py-2.5 text-[11px] text-amber-50/95 leading-snug">
            <p className="font-bold text-amber-100 mb-1">{clientCompliance.title}</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-50/90">
              {clientCompliance.lines.map((ln, i) => (
                <li key={i}>{ln}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="px-4 mb-4 space-y-2">
          <button
            type="button"
            onClick={() => onStartChat?.(expert)}
            className="w-full flex flex-col items-center justify-center gap-1 px-4 py-4 rounded-2xl bg-blue-500/30 border border-blue-400/40 hover:bg-blue-500/40 transition-all group text-center"
          >
            <span className="flex items-center justify-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-200 shrink-0" />
              <span className="text-sm font-semibold text-white">
                {actionType === 'mentor' ? 'Chat bilan bog‘lanish' : 'Maslahat yozish (chat)'}
              </span>
            </span>
            {actionType === 'consultant' && (
              <span className="text-[11px] text-blue-100/80 font-medium leading-snug px-1">
                Shaxsiy chat ochiladi — savolingizni yozing, mutaxassis javobidan keyin onlayn uchrashuvni davom ettiradi.
              </span>
            )}
          </button>
        </div>

        {actionType === 'mentor' && (
          <div className="px-4 mb-3 space-y-3">
            <div>
              <button
                type="button"
                onClick={handleTolovQilish}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all group shadow-lg shadow-cyan-500/10 ${
                  !hasActiveSubscription
                    ? 'bg-gradient-to-r from-amber-500/50 via-cyan-500/35 to-slate-600/40 border-amber-400/40 ring-1 ring-amber-400/20'
                    : 'bg-gradient-to-r from-cyan-400/40 via-slate-500/30 to-slate-600/40 border-cyan-400/30 hover:from-cyan-400/50'
                }`}
              >
                <Wallet className="h-5 w-5 text-cyan-200" />
                <span className="flex-1 text-left text-sm font-semibold text-white">
                  {!hasActiveSubscription ? "1-bosqich: to'lov (obuna)" : "To'lov / obuna (yangilash)"}
                </span>
              </button>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDarsigaQoshilish}
                disabled={joinLoading || subStatusLoading}
                title={
                  !hasActiveSubscription
                    ? "Bosilganda obuna tekshiriladi; yo'q bo'lsa to'lov oynasi ochiladi"
                    : 'Guruhni tanlang va chatga o‘ting'
                }
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400/50 via-teal-500/40 to-blue-600/40 border border-emerald-400/30 hover:from-emerald-400/60 hover:to-blue-600/50 transition-all group shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinLoading || subStatusLoading ? (
                  <span className="flex-1 text-center text-sm font-semibold text-white">Yuklanmoqda...</span>
                ) : (
                  <>
                    <GraduationCap className="h-5 w-5 text-emerald-200 shrink-0" />
                    <span className="flex-1 text-left text-sm font-semibold text-white">
                      2-bosqich: darsga qo&apos;shilish
                    </span>
                  </>
                )}
              </button>
              {!hasActiveSubscription && !subStatusLoading && (
                <p className="text-[10px] text-amber-200/80 text-center leading-snug px-1">
                  Avval yuqoridagi to&apos;lovni bajaring; keyin guruhni tanlab dars chatiga kirasiz.
                </p>
              )}
            </div>
          </div>
        )}
        {actionType === 'consultant' && (
          <div className="px-4 mb-3">
            <button
              type="button"
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400/50 via-teal-500/40 to-blue-600/40 border border-emerald-400/30 hover:from-emerald-400/60 hover:to-blue-600/50 transition-all group shadow-lg shadow-emerald-500/10"
            >
              <Lightbulb className="h-5 w-5 text-emerald-200" />
              <span className="flex-1 text-left text-sm font-semibold text-white">Maslahat olish</span>
            </button>
          </div>
        )}

        {actionType !== 'mentor' && (
          <div className="px-4 mb-5">
            <button
              type="button"
              onClick={handleTolovQilish}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400/40 via-slate-500/30 to-slate-600/40 border border-cyan-400/30 hover:from-cyan-400/50 transition-all group shadow-lg shadow-cyan-500/10"
            >
              <Wallet className="h-5 w-5 text-cyan-200" />
              <span className="flex-1 text-left text-sm font-semibold text-white">To&apos;lov qilish</span>
            </button>
          </div>
        )}

        <div className="flex-1 min-h-[80px] mx-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden" />

        <div className="p-4 pt-2 shrink-0">
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/10 border border-white/20">
            <button type="button" className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-all">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              placeholder="Xabar yozish..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none min-w-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickMessage.trim()) {
                  window.dispatchEvent(
                    new CustomEvent('panel_quick_send', { detail: { text: quickMessage.trim() } })
                  );
                  setQuickMessage('');
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (quickMessage.trim()) {
                  window.dispatchEvent(
                    new CustomEvent('panel_quick_send', { detail: { text: quickMessage.trim() } })
                  );
                  setQuickMessage('');
                }
              }}
              className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-500/90 text-white transition-all shadow-md shadow-emerald-500/20"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div
          className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#1a1d24] border border-white/10 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg">To&apos;lov qiling</h3>
            <p className="text-white/70 text-sm">
              <span className="text-emerald-300 font-medium">{mentorName}</span> ustozga 30 kunlik dars obunasi. Summaning
              barchasi avval <strong className="text-white/90">muzlatiladi</strong> (hamyonda «qulflangan»);{' '}
              <strong className="text-white/90">30 kalendar kun</strong> tugagach platforma komissiyasini ushlab qolgan
              qismi ustoz hisobiga o&apos;tkaziladi.
            </p>
            <div>
              <label className="block text-xs font-bold text-white/50 mb-2">Obuna narxi (MALI)</label>
              <input
                type="number"
                min={1}
                value={subAmount}
                onChange={(e) => setSubAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-white/40 mt-1.5">
                Standart narx profilidagi soatlik/dars narxidan; kerak bo‘lsa o‘zgartiring. To‘lovdan keyin guruhni tanlab
                darsga kirasiz.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium"
              >
                Bekor
              </button>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing || subAmount <= 0}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold"
              >
                {subscribing ? "To'lanmoqda..." : `${subAmount} MALI — Obuna`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupPicker && pickableGroups.length > 0 && (
        <div
          className="absolute inset-0 z-[82] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowGroupPicker(false)}
        >
          <div
            className="w-full max-w-sm max-h-[70vh] rounded-2xl bg-[#1a1d24] border border-white/10 p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg">Dars guruhini tanlang</h3>
            <p className="text-white/60 text-xs">Bir nechta guruh bo‘lsa, qaysiga qo‘shilishingizni tanlang.</p>
            <ul className="overflow-y-auto space-y-2 flex-1 min-h-0 pr-1">
              {pickableGroups.map((g) => {
                const gid = g.chatId || g.id;
                return (
                  <li key={String(gid)}>
                    <button
                      type="button"
                      disabled={joinLoading || !gid}
                      onClick={() => handlePickGroup(g)}
                      className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition-colors disabled:opacity-50"
                    >
                      <span className="text-white font-medium block">{g.name || 'Guruh'}</span>
                      {g.time && <span className="text-white/45 text-xs">{g.time}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                setShowGroupPicker(false);
                setPickableGroups([]);
              }}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium"
            >
              Bekor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
