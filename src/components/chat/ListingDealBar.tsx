'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { isExpertListingChat } from '@/lib/listing-chat';

type Deal = {
  id: string;
  chat_id: string;
  expert_id: string;
  client_id: string;
  amount: string | number;
  status: string;
  transaction_id?: string | null;
};

export default function ListingDealBar({
  chat,
  currentUserId,
}: {
  chat: any;
  currentUserId?: string | null;
}) {
  const { socket } = useSocket();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [role, setRole] = useState<'expert' | 'client' | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!chat?.id || !currentUserId || !isExpertListingChat(chat)) return;
    try {
      const res = await apiFetch(`/api/listing-deals/chat/${encodeURIComponent(String(chat.id))}`);
      if (!res.ok) return;
      const d = await res.json();
      setDeal(d.deal || null);
      setRole(d.role || null);
    } catch {
      /* ignore */
    }
  }, [chat?.id, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !chat?.id) return;
    const onUpd = (p: any) => {
      if (String(p?.chatId) === String(chat.id)) load();
    };
    socket.on('listing_deal_updated', onUpd);
    return () => {
      socket.off('listing_deal_updated', onUpd);
    };
  }, [socket, chat?.id, load]);

  if (!chat?.id || !currentUserId || !isExpertListingChat(chat)) return null;

  const requestPay = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiFetch('/api/listing-deals/request', {
        method: 'POST',
        body: JSON.stringify({ chatId: chat.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'So‘rov yuborilmadi');
      setDeal(data.deal);
      setMsg("Mijozga to‘lov tugmasi ko‘rinadi.");
    } catch (e: any) {
      setMsg(e?.message || 'Xato');
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    if (!deal?.id) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiFetch('/api/listing-deals/pay', {
        method: 'POST',
        body: JSON.stringify({ dealId: deal.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'To‘lov amalga oshmadi');
      await load();
      setMsg('Mablag‘ muzlatildi. Mutaxassis xizmatni bajarilgan deb belgilagach, siz tasdiqlab mablag‘ni chiqarasiz.');
    } catch (e: any) {
      setMsg(e?.message || 'Xato');
    } finally {
      setLoading(false);
    }
  };

  const markServiceDone = async () => {
    if (!deal?.id) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiFetch('/api/listing-deals/mark-done', {
        method: 'POST',
        body: JSON.stringify({ dealId: deal.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Belgilab bo‘lmadi');
      await load();
      setMsg('Mijozga «xizmat bajarildi» yuborildi. Mablag‘ chiqishi uchun mijoz tasdig‘i kerak.');
    } catch (e: any) {
      setMsg(e?.message || 'Xato');
    } finally {
      setLoading(false);
    }
  };

  const confirmRelease = async () => {
    if (!deal?.id) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiFetch('/api/listing-deals/complete', {
        method: 'POST',
        body: JSON.stringify({ dealId: deal.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Yakunlanmadi');
      await load();
      setMsg('Mablag‘ mutaxassis hisobiga o‘tdi (komissiya ushlab qolinadi).');
    } catch (e: any) {
      setMsg(e?.message || 'Xato');
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!deal?.id) return;
    if (!confirm('Kelishuvni bekor qilasizmi?')) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiFetch('/api/listing-deals/cancel', {
        method: 'POST',
        body: JSON.stringify({ dealId: deal.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Bekor qilinmadi');
      setDeal(null);
      setMsg('Bekor qilindi.');
    } catch (e: any) {
      setMsg(e?.message || 'Xato');
    } finally {
      setLoading(false);
    }
  };

  const amt = deal ? Number(deal.amount) : 0;

  return (
    <div className="shrink-0 border-t border-emerald-500/25 bg-emerald-950/40 px-3 py-2.5 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/90">
        E&apos;lon bo‘yicha to‘lov (escrow)
      </p>
      {msg && <p className="text-[11px] text-white/80 leading-snug">{msg}</p>}

      {role === 'expert' && (
        <div className="flex flex-wrap gap-2">
          {(!deal || deal.status === 'pending_payment') && (
            <button
              type="button"
              disabled={loading}
              onClick={requestPay}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              To‘lovni so'rash (mijozga tugma)
            </button>
          )}
          {deal?.status === 'escrow_held' && (
            <button
              type="button"
              disabled={loading}
              onClick={markServiceDone}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              Xizmat bajarildi deb belgilash
            </button>
          )}
          {deal?.status === 'pending_client_confirm' && (
            <p className="text-[11px] text-sky-200/90 w-full">
              Mijoz xizmatni qabul qilib mablag‘ni chiqarishni tasdiqlashini kuting. O‘zingiz mablag‘ni yecha olmaysiz.
            </p>
          )}
          {deal &&
            (deal.status === 'pending_payment' ||
              deal.status === 'escrow_held' ||
              deal.status === 'pending_client_confirm') && (
            <button
              type="button"
              disabled={loading}
              onClick={cancel}
              className="px-3 py-2 rounded-xl bg-white/10 text-white/70 text-xs hover:bg-white/15 disabled:opacity-50"
            >
              Bekor qilish
            </button>
          )}
        </div>
      )}

      {role === 'client' && deal?.status === 'pending_payment' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/80">
            Mutaxassis {amt} MALI to‘lashni kutmoqda
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={pay}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold disabled:opacity-50"
          >
            To‘lov qilish (muzlatish)
          </button>
        </div>
      )}

      {role === 'client' && deal?.status === 'escrow_held' && (
        <p className="text-[11px] text-emerald-100/80">
          {amt} MALI tizimda muzlatilgan. Mutaxassis xizmatni bajarilgan deb belgilagach, siz tasdiqlab mablag‘ni
          chiqarasiz.
        </p>
      )}

      {role === 'client' && deal?.status === 'pending_client_confirm' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-emerald-100/90">
            Mutaxassis xizmatni bajarilgan deb belgiladi. Qabul qilsangiz, {amt} MALI (komissiyadan keyin) unga
            o‘tadi.
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={confirmRelease}
            className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold disabled:opacity-50"
          >
            Xizmat qabul qilindi — mablag‘ni chiqarish
          </button>
        </div>
      )}
    </div>
  );
}
