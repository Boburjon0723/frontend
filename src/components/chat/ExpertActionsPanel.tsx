"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageCircle, Lightbulb, GraduationCap, Wallet, Paperclip, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
const DEFAULT_MONTHLY_MALI = 100;

interface ExpertActionsPanelProps {
  expert: any;
  onClose?: () => void;
  onStartChat?: (expert: any) => void;
}

/** Mentor (o'qituvchi, dars) yoki Advokat/Psixolog aniqlash */
function getExpertActionType(expert: any): 'mentor' | 'consultant' | null {
  const p = (expert?.profession || expert?.specialty || '').toLowerCase();
  const bio = (expert?.bio_expert || expert?.specialty_desc || '').toLowerCase();
  const text = `${p} ${bio}`;
  if (/o['']?qituvchi|mentor|teacher|dars|o['']?quv/.test(text)) return 'mentor';
  if (/advokat|psixolog|lawyer|psychologist|maslahat/.test(text)) return 'consultant';
  return null;
}

export default function ExpertActionsPanel({ expert, onClose, onStartChat }: ExpertActionsPanelProps) {
  const router = useRouter();
  const [quickMessage, setQuickMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subAmount, setSubAmount] = useState(DEFAULT_MONTHLY_MALI);
  const actionType = getExpertActionType(expert);

  const mentorName = expert?.name ? `${expert.name} ${expert.surname || ''}`.trim() : expert?.profession || 'Ustoz';

  const handleDarsigaQoshilish = async () => {
    if (!expert?.id || actionType !== 'mentor') return;
    setJoinLoading(true);
    try {
      const subRes = await apiFetch(`/api/wallet/subscription-status?mentorId=${encodeURIComponent(expert.id)}`);
      if (!subRes.ok) {
        setShowPaymentModal(true);
        return;
      }
        const data = await subRes.json();
      if (data.active) {
        const groupsRes = await fetch(`${API_URL}/api/chats/expert/${expert.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!groupsRes.ok) throw new Error('Guruhlar topilmadi');
        const groups = await groupsRes.json();
        const groupId = Array.isArray(groups) && groups.length > 0 ? groups[0].chatId || groups[0].id : null;
        if (groupId) {
          const joinRes = await apiFetch(`/api/chats/${groupId}/join-with-subscription`, { method: 'POST' });
          if (!joinRes.ok) {
            const err = await joinRes.json().catch(() => ({}));
            alert(err?.message || 'Guruhga qo\'shilishda xatolik');
            return;
          }
          router.push(`/messages?room=${groupId}`);
        } else {
          alert('Ustoz hali dars guruhini ochmagan. Avval chat orqali bog\'laning.');
        }
      } else {
        setShowPaymentModal(true);
      }
    } catch (e) {
      console.error(e);
      setShowPaymentModal(true);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!expert?.id || subAmount <= 0) return;
    setSubscribing(true);
    try {
      const res = await apiFetch('/api/wallet/subscribe-to-mentor', {
        method: 'POST',
        body: JSON.stringify({ mentorId: expert.id, amount: Number(subAmount) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPaymentModal(false);
        handleDarsigaQoshilish();
      } else {
        alert(data.message || "Obunada xatolik");
      }
    } catch (e: any) {
      alert(e?.message || "Obunada xatolik");
    } finally {
      setSubscribing(false);
    }
  };

  if (!expert) return null;

  return (
    <div className="fixed lg:relative inset-0 lg:inset-auto z-[70] lg:z-0 h-full w-full flex flex-col bg-[#788296]/25 lg:bg-transparent backdrop-blur-[20px] lg:backdrop-blur-none border-l-0 lg:border-l lg:border-white/20 overflow-hidden animate-slide-left select-none relative">
      <div className="lg:hidden absolute inset-0 bg-slate-900/40 -z-10" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-4">
        {/* Chat tugmasi */}
        <div className="px-4 mb-4">
          <button
            onClick={() => onStartChat?.(expert)}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-blue-500/30 border border-blue-400/40 hover:bg-blue-500/40 transition-all group"
          >
            <MessageCircle className="h-5 w-5 text-blue-200" />
            <span className="text-sm font-semibold text-white">Chat</span>
          </button>
        </div>

        {/* Shartli tugma: Mentor → Darsiga qo'shilish | Advokat/Psixolog → Maslahat olish */}
        {actionType === 'mentor' && (
          <div className="px-4 mb-3">
            <button
              onClick={handleDarsigaQoshilish}
              disabled={joinLoading}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400/50 via-teal-500/40 to-blue-600/40 border border-emerald-400/30 hover:from-emerald-400/60 hover:to-blue-600/50 transition-all group shadow-lg shadow-emerald-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {joinLoading ? (
                <span className="flex-1 text-center text-sm font-semibold text-white">Yuklanmoqda...</span>
              ) : (
                <>
                  <GraduationCap className="h-5 w-5 text-emerald-200 shrink-0" />
                  <span className="flex-1 text-left text-sm font-semibold text-white">Darsiga qo&apos;shilish</span>
                </>
              )}
            </button>
          </div>
        )}
        {actionType === 'consultant' && (
          <div className="px-4 mb-3">
            <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400/50 via-teal-500/40 to-blue-600/40 border border-emerald-400/30 hover:from-emerald-400/60 hover:to-blue-600/50 transition-all group shadow-lg shadow-emerald-500/10">
              <Lightbulb className="h-5 w-5 text-emerald-200" />
              <span className="flex-1 text-left text-sm font-semibold text-white">Maslahat olish</span>
            </button>
          </div>
        )}

        {/* To'lov – har doim */}
        <div className="px-4 mb-5">
          <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400/40 via-slate-500/30 to-slate-600/40 border border-cyan-400/30 hover:from-cyan-400/50 transition-all group shadow-lg shadow-cyan-500/10">
            <Wallet className="h-5 w-5 text-cyan-200" />
            <span className="flex-1 text-left text-sm font-semibold text-white">To&apos;lov qilish</span>
          </button>
        </div>

        {/* Chat xabarlar maydoni (placeholder) */}
        <div className="flex-1 min-h-[80px] mx-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden" />

        {/* Xabar yozish input – pastda */}
        <div className="p-4 pt-2 shrink-0">
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/10 border border-white/20">
            <button className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-all">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              placeholder="Xabar yozish..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none min-w-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickMessage.trim()) {
                  window.dispatchEvent(new CustomEvent('panel_quick_send', { detail: { text: quickMessage.trim() } }));
                  setQuickMessage('');
                }
              }}
            />
            <button
              onClick={() => {
                if (quickMessage.trim()) {
                  window.dispatchEvent(new CustomEvent('panel_quick_send', { detail: { text: quickMessage.trim() } }));
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

      {/* To'lov modal: obuna qilmagan bo'lsa */}
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
              30 kun davomida <span className="text-emerald-300">{mentorName}</span> ustozning darslariga kirish uchun obuna bo&apos;ling.
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
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium"
              >
                Bekor
              </button>
              <button
                onClick={handleSubscribe}
                disabled={subscribing || subAmount <= 0}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold"
              >
                {subscribing ? 'To\'lanmoqda...' : `${subAmount} MALI — Obuna`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
