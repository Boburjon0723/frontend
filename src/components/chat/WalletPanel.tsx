import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { useSocket } from '@/context/SocketContext';

function WalletHistoryCard({ transactions }: { transactions: any[] }) {
    return (
        <GlassCard className="!p-3 lg:!p-5 !rounded-[1.25rem] lg:!rounded-[25px] border border-amber-500/15 bg-gradient-to-br from-[rgba(var(--glass-rgb),0.55)] to-[rgba(var(--glass-rgb),0.35)] backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm lg:text-base tracking-tight">Tranzaksiya tarixi</h3>
                        <p className="text-white/40 text-[10px] lg:text-xs">MALI yuborish va qabul qilishlar</p>
                    </div>
                </div>
                {transactions.length > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-100/90 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-400/25 shrink-0 tabular-nums">
                        {transactions.length}
                    </span>
                )}
            </div>
            {transactions.length === 0 ? (
                <div className="text-center py-7 lg:py-9 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <p className="text-white/35 text-xs lg:text-sm">Hali tranzaksiyalar mavjud emas</p>
                </div>
            ) : (
                <div className="max-h-[min(42vh,280px)] sm:max-h-[300px] lg:max-h-[420px] overflow-y-auto overscroll-y-contain custom-scrollbar space-y-2 pr-0.5 -mr-0.5">
                    {transactions.map((tx) => {
                        const currentUser = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('user') || '{}' : '{}');
                        const userId = currentUser.id || currentUser.userId;
                        const isSender = tx.sender_id === userId;
                        const otherName = isSender ? (tx.receiver_name || 'Tizim') : (tx.sender_name || 'Tizim');
                        const otherAvatar = isSender ? tx.receiver_avatar : tx.sender_avatar;

                        return (
                            <div
                                key={tx.id}
                                className="p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/15 transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-center gap-2 relative z-10">
                                    <div className="flex items-center gap-2.5 lg:gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white/5 p-0.5 border border-white/10 shrink-0">
                                            {otherAvatar ? (
                                                <img src={otherAvatar} alt="" className="w-full h-full object-cover rounded-[10px] lg:rounded-[12px]" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent rounded-[10px] lg:rounded-[12px]">
                                                    <span className="text-white text-xs lg:text-sm font-bold">{otherName[0]}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-xs lg:text-sm truncate">
                                                {isSender ? 'Yuborilgan: ' : 'Qabul: '}
                                                {otherName}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${isSender ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                                                    {isSender ? 'Chiquvchi' : 'Kiruvchi'}
                                                </span>
                                                <span className="text-[9px] text-white/30 font-bold">
                                                    {new Date(tx.created_at).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-base lg:text-lg font-black tabular-nums ${isSender ? 'text-white/90' : 'text-emerald-400'}`}>
                                            {isSender ? '-' : '+'}
                                            {Number(tx.amount).toLocaleString()}
                                        </p>
                                        <p className="text-[9px] text-white/25 font-black uppercase tracking-widest">MALI</p>
                                    </div>
                                </div>
                                {tx.note && (
                                    <p className="mt-2 pt-2 border-t border-white/5 text-[10px] lg:text-[11px] text-white/40 italic truncate relative z-10">{tx.note}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </GlassCard>
    );
}

export default function WalletPanel({ onChatSelect }: { onChatSelect?: (chat: any) => void }) {
    const { socket } = useSocket();
    const [balance, setBalance] = useState({ available: 0, locked: 0, hasPin: false });
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');

    // Top Up State
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [topUpStatus, setTopUpStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [topUpError, setTopUpError] = useState('');
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawCard, setWithdrawCard] = useState('');
    const [withdrawPin, setWithdrawPin] = useState('');
    const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [withdrawError, setWithdrawError] = useState('');

    // Buy/Sell States
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [marketTab, setMarketTab] = useState<'none' | 'buy' | 'sell' | 'my-buy' | 'my-sell'>('none');
    const [p2pAds, setP2pAds] = useState<any[]>([]);
    const [showCreateAd, setShowCreateAd] = useState(false);
    const [createAdData, setCreateAdData] = useState({ amount: '', price: '' });
    const [myTrades, setMyTrades] = useState<any[]>([]);
    const [myAds, setMyAds] = useState<any[]>([]);
    const [editingAd, setEditingAd] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletConfig, setWalletConfig] = useState<{ adminCard: string | null; systemAvailableMali: number }>({
        adminCard: null,
        systemAvailableMali: 0
    });
    const [contacts, setContacts] = useState<any[]>([]);
    const [showSendModal, setShowSendModal] = useState(false);
    const [sendRecipientId, setSendRecipientId] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [sendPin, setSendPin] = useState('');
    const [sendNote, setSendNote] = useState('');
    const [sendSearch, setSendSearch] = useState('');
    const [sendStatus, setSendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [sendError, setSendError] = useState('');

    const MIN_TOPUP = 10;
    const MAX_TOPUP = 1000000;
    const MIN_WITHDRAW = 10;

    // Fetch Ads
    const fetchAds = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const typeToFetch = marketTab === 'buy' ? 'sell' : 'buy';
            const res = await fetch(`${API_URL}/api/p2p?type=${typeToFetch}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setP2pAds(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchMyAds = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/my-ads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyAds(data);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (marketTab !== 'none') {
            fetchAds();
            const interval = setInterval(fetchAds, 10000);
            return () => clearInterval(interval);
        }
    }, [marketTab]);

    const handleCreateAd = async () => {
        if (!createAdData.amount || !createAdData.price) return alert("Ma'lumotlarni to'ldiring");
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    type: marketTab,
                    amount: parseFloat(createAdData.amount),
                    price: parseFloat(createAdData.price)
                })
            });

            if (res.ok) {
                alert("E'lon yaratildi! U boshqa foydalanuvchilarning ro'yxatida ko'rinadi.");
                setShowCreateAd(false);
                setCreateAdData({ amount: '', price: '' });
                fetchMyAds();
            } else {
                const err = await res.json();
                alert(err.message || "Xatolik");
            }
        } catch (e) { alert("Server Xatosi"); }
    };

    const handleUpdateAd = async () => {
        if (!editingAd) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    adId: editingAd.id,
                    price: parseFloat(editingAd.price_uzs),
                    amount: parseFloat(editingAd.amount_mali),
                    min_limit: parseFloat(editingAd.min_limit_uzs),
                    max_limit: parseFloat(editingAd.max_limit_uzs)
                })
            });

            if (res.ok) {
                alert("E'lon tahrirlandi!");
                setEditingAd(null);
                fetchMyAds();
                if (marketTab !== 'none') fetchAds();
            } else {
                const err = await res.json();
                alert(err.message || "Xatolik");
            }
        } catch (e) { alert("Server Xatosi"); }
    };

    const handleDeleteAd = async (adId: any) => {
        if (!confirm("E'lonni o'chirmoqchimisiz?")) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/${adId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("E'lon o'chirildi!");
                fetchMyAds();
                if (marketTab !== 'none') fetchAds();
            } else {
                const err = await res.json();
                alert(err.message || "Xatolik");
            }
        } catch (e) { alert("Xatolik"); }
    };

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/token/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchBalance = async () => {
        // ... (existing code kept same)
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/token/balance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBalance({
                    available: parseFloat(data.balance),
                    locked: parseFloat(data.locked_balance),
                    hasPin: data.hasPin
                });
            }
        } catch (e) {
            console.error("Failed to fetch balance", e);
        }
    };

    const fetchWalletConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/token/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            setWalletConfig({
                adminCard: data.admin_card_number || null,
                systemAvailableMali: Number(data.system_available_mali || 0)
            });
        } catch (e) {
            console.error('Failed to fetch wallet config', e);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/token/topup`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingRequests(data.filter((r: any) => r.status === 'pending'));
            }
        } catch (e) { console.error(e); }
    };

    const fetchMyTrades = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/trades`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyTrades(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/users/contacts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setContacts(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Failed to fetch contacts', e);
        }
    };

    const handleTrade = async (ad: any) => {
        const amount = prompt(`${ad.user_name} foydalanuvchidan necha MALI ${marketTab === 'buy' ? 'sotib olmoqchisiz' : 'sotmoqchisiz'}?`, ad.amount_mali);
        if (!amount || isNaN(Number(amount))) return;

        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/trade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ adId: ad.id, amount: parseFloat(amount) })
            });

            if (res.ok) {
                alert("Savdo boshlandi! Tranzaksiya holatini tekshiring.");
                fetchBalance();
                fetchMyTrades();
            } else {
                const err = await res.json();
                alert(err.message || "Xatolik");
            }
        } catch (e) { alert("Server Xatosi"); }
    };

    const handleTradeChat = async (tradeId: string) => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/trade-chat/${tradeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const chat = await res.json();
                if (onChatSelect) onChatSelect(chat);
            } else {
                alert("Chat room topilmadi");
            }
        } catch (e) { console.error(e); }
    };

    const handleConfirmTrade = async (tradeId: any) => {
        if (!confirm("To'lovni olganingizni tasdiqlaysizmi? MALI tokenlari xaridorga o'tkaziladi.")) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/trade/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ tradeId })
            });
            if (res.ok) {
                fetchMyTrades();
                fetchBalance();
            } else {
                const err = await res.json();
                alert(err.message || "Xatolik");
            }
        } catch (e) { alert("Xatolik"); }
    };

    const handleCancelTrade = async (tradeId: any) => {
        if (!confirm("Savdoni bekor qilmoqchimisiz?")) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/trade/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ tradeId })
            });
            if (res.ok) {
                fetchMyTrades();
                fetchBalance();
            } else {
                const err = await res.json();
                alert(err.message || "Xatolik");
            }
        } catch (e) { alert("Xatolik"); }
    };

    useEffect(() => {
        fetchBalance();
        fetchTransactions();
        fetchPendingRequests();
        fetchMyTrades();
        fetchMyAds();
        fetchWalletConfig();
        if (socket) {
            socket.on('balance_updated', () => {
                fetchBalance();
                fetchTransactions();
            });
            socket.on('p2p_ads_updated', () => {
                if (marketTab !== 'none') fetchAds();
                fetchMyAds();
            });
            socket.on('p2p_trade_initiated', (data: any) => {
                console.log('Trade initiated:', data);
                fetchMyTrades();
            });
            socket.on('p2p_trade_updated', () => {
                fetchMyTrades();
                fetchBalance();
            });
            return () => {
                socket.off('balance_updated');
                socket.off('p2p_ads_updated');
                socket.off('p2p_trade_initiated');
                socket.off('p2p_trade_updated');
            };
        }
    }, [socket, marketTab]);

    const handleSetPin = async () => {
        if (newPin.length !== 4 || isNaN(Number(newPin))) { setPinError('PIN must be 4 digits'); return; }
        if (newPin !== confirmPin) { setPinError('PINs do not match'); return; }
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/token/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pin: newPin })
            });
            if (res.ok) {
                alert('PIN Setup Successful!');
                setShowPinSetup(false);
                fetchBalance();
            } else { setPinError('Failed to set PIN'); }
        } catch (e) { setPinError('Network Error'); }
    };

    const handleRecovery = async () => {
        if (!confirm("Start 30-day recovery process?")) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            await fetch(`${API_URL}/api/token/recovery`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            alert("Recovery requested");
        } catch (e) { alert("Error"); }
    };

    const transformTopUp = async () => {
        const numericAmount = Number(topUpAmount);
        if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            setTopUpError("Iltimos to'g'ri summa kiriting.");
            return;
        }
        if (numericAmount < MIN_TOPUP) {
            setTopUpError(`Minimal summa ${MIN_TOPUP} MALI.`);
            return;
        }
        if (numericAmount > MAX_TOPUP) {
            setTopUpError(`Maksimal summa ${MAX_TOPUP.toLocaleString()} MALI.`);
            return;
        }
        setTopUpError('');
        setTopUpStatus('loading');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/token/topup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: parseFloat(topUpAmount) })
            });

            if (res.ok) {
                setTopUpStatus('success');
                setTopUpAmount('');
                setTopUpError('');
                fetchPendingRequests();
                setTimeout(() => {
                    setShowTopUpModal(false);
                    setTopUpStatus('idle');
                }, 2000);
            } else {
                setTopUpStatus('error');
                const err = await res.json();
                setTopUpError(err.message || "So'rov yuborishda xatolik yuz berdi.");
            }
        } catch (e) {
            setTopUpStatus('error');
            setTopUpError("Serverga ulanib bo'lmadi. Qayta urinib ko'ring.");
        }
    };

    const handleSend = () => {
        setSendStatus('idle');
        setSendError('');
        setSendAmount('');
        setSendPin('');
        setSendNote('');
        setSendSearch('');
        setShowSendModal(true);
        fetchContacts();
    };

    const submitSend = async () => {
        const numericAmount = Number(sendAmount);
        if (!sendRecipientId) {
            setSendError("Kontaktni tanlang.");
            return;
        }
        if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            setSendError("To'g'ri summa kiriting.");
            return;
        }
        if (numericAmount > balance.available) {
            setSendError("Balans yetarli emas.");
            return;
        }
        if (!sendPin || sendPin.length !== 4 || Number.isNaN(Number(sendPin))) {
            setSendError("4 xonali PIN kiriting.");
            return;
        }

        setSendStatus('loading');
        setSendError('');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const res = await fetch(`${API_URL}/api/token/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    receiverId: sendRecipientId,
                    amount: numericAmount,
                    pin: sendPin,
                    note: sendNote.trim() || undefined
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setSendStatus('error');
                setSendError(err.message || "Yuborishda xatolik yuz berdi.");
                return;
            }
            setSendStatus('success');
            fetchBalance();
            fetchTransactions();
            setTimeout(() => {
                setShowSendModal(false);
                setSendStatus('idle');
            }, 1200);
        } catch {
            setSendStatus('error');
            setSendError("Serverga ulanib bo'lmadi. Qayta urinib ko'ring.");
        }
    };

    const handleWithdraw = async () => {
        const numericAmount = Number(withdrawAmount);
        const cleanCard = withdrawCard.replace(/\D/g, '');
        if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            setWithdrawError("Iltimos to'g'ri summa kiriting.");
            return;
        }
        if (numericAmount < MIN_WITHDRAW) {
            setWithdrawError(`Minimal yechish summasi ${MIN_WITHDRAW} MALI.`);
            return;
        }
        if (numericAmount > balance.available) {
            setWithdrawError("Balans yetarli emas.");
            return;
        }
        if (numericAmount > walletConfig.systemAvailableMali) {
            setWithdrawError("Tizim rezervida yetarli MALI yo'q. Kichikroq summa kiriting.");
            return;
        }
        if (cleanCard.length < 16) {
            setWithdrawError("Karta raqamini to'liq kiriting.");
            return;
        }
        if (!withdrawPin || withdrawPin.length !== 4 || Number.isNaN(Number(withdrawPin))) {
            setWithdrawError("4 xonali PIN kiriting.");
            return;
        }

        setWithdrawStatus('loading');
        setWithdrawError('');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
            const usersRes = await fetch(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!usersRes.ok) {
                setWithdrawStatus('error');
                setWithdrawError("Admin foydalanuvchisi topilmadi. Keyinroq urinib ko'ring.");
                return;
            }
            const users = await usersRes.json();
            const admin = users.find((u: any) => u.role === 'admin');
            if (!admin?.id) {
                setWithdrawStatus('error');
                setWithdrawError("Yechish vaqtincha mavjud emas. Support bilan bog'laning.");
                return;
            }

            const transferRes = await fetch(`${API_URL}/api/token/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    receiverId: admin.id,
                    amount: numericAmount,
                    pin: withdrawPin,
                    note: `WITHDRAW_REQUEST:${cleanCard}`
                })
            });
            if (!transferRes.ok) {
                const err = await transferRes.json().catch(() => ({}));
                setWithdrawStatus('error');
                setWithdrawError(err.message || "Yechish so'rovini yuborib bo'lmadi.");
                return;
            }

            setWithdrawStatus('success');
            setWithdrawAmount('');
            setWithdrawCard('');
            setWithdrawPin('');
            fetchBalance();
            fetchTransactions();
            fetchWalletConfig();
            setTimeout(() => {
                setShowWithdrawModal(false);
                setWithdrawStatus('idle');
            }, 1600);
        } catch {
            setWithdrawStatus('error');
            setWithdrawError("Serverga ulanib bo'lmadi. Qayta urinib ko'ring.");
        }
    };

    return (
        <div className="flex-1 min-h-0 h-auto w-full flex flex-col gap-3 lg:gap-6 px-1 py-1 lg:p-6 lg:pt-12 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-6 lg:h-full overflow-visible lg:overflow-y-auto lg:overscroll-y-contain lg:custom-scrollbar relative">
            <div className="hidden lg:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 space-y-3 lg:space-y-6 lg:max-w-2xl lg:mx-auto w-full">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
                    <div className="hidden lg:block">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Mening Hamyonim</h2>
                        <p className="text-white/50 text-sm sm:text-base">MALI raqamli aktivlaringizni boshqaring</p>
                    </div>
                </div>

                <div className="space-y-3 lg:space-y-6 animate-fade-in">
                        {!balance.hasPin && !showPinSetup && (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between animate-pulse-slow">
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <div>
                                        <p className="text-amber-400 font-bold">PIN kod o'rnatilmagan!</p>
                                        <p className="text-amber-200/70 text-xs">Tranzaksiyalar uchun PIN kod shart.</p>
                                    </div>
                                </div>
                                <GlassButton onClick={() => setShowPinSetup(true)} variant="premium" className="!py-2 !px-4 !rounded-lg !text-xs shadow-none">O'rnatish</GlassButton>
                            </div>
                        )}

                        {showPinSetup && (
                            <GlassCard className="p-6 border-amber-500/20 bg-amber-900/10">
                                <h3 className="text-white font-bold mb-4">PIN Kod O'rnatish</h3>
                                <div className="space-y-4 max-w-xs">
                                    <input type="password" maxLength={4} placeholder="New PIN" className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white text-center tracking-widest" value={newPin} onChange={e => setNewPin(e.target.value)} />
                                    <input type="password" maxLength={4} placeholder="Confirm PIN" className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white text-center tracking-widest" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} />
                                    {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
                                    <div className="flex gap-2">
                                        <GlassButton onClick={handleSetPin} variant="premium" className="flex-1 py-2 !rounded-lg text-sm">Save</GlassButton>
                                        <GlassButton onClick={() => setShowPinSetup(false)} variant="secondary" className="px-4 py-2 !rounded-lg text-sm">Cancel</GlassButton>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        <GlassCard className="p-4 lg:p-8 relative overflow-hidden border-white/10 bg-gradient-to-br from-[rgba(var(--glass-rgb),0.8)] to-[rgba(var(--glass-rgb),0.6)] backdrop-blur-xl !rounded-[1.25rem] lg:!rounded-[25px]">
                            <div className="absolute top-0 right-0 p-2 lg:p-4 opacity-10 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 lg:h-48 lg:w-48 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>

                            <div className="relative z-10">
                                <p className="text-emerald-400 font-medium tracking-wider text-[10px] lg:text-sm uppercase mb-1 lg:mb-2">Umumiy Balans</p>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white tracking-tight">{balance.available.toLocaleString()}</span>
                                    <span className="text-sm lg:text-xl font-medium text-white/60">MALI</span>
                                </div>
                                <p className="text-white/40 text-xs lg:text-sm mt-1 lg:mt-2">≈ {(balance.available * 4899).toLocaleString()} UZS</p>
                            </div>
                        </GlassCard>

                        {pendingRequests.length > 0 && (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-spin">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-blue-400 font-bold">{pendingRequests.length} ta so'rov tekshiruvda</p>
                                        <p className="text-blue-200/70 text-xs">Admin tasdiqlashini kuting.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Desktop: eski layout */}
                        <div className="hidden lg:block">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-2">
                                <button
                                    onClick={() => setShowTopUpModal(true)}
                                    className="group flex flex-col items-center gap-2 transition-all active:scale-90"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-xl group-hover:bg-emerald-500 transition-all duration-500">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 group-hover:bg-white flex items-center justify-center shadow-lg transition-all duration-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                    </div>
                                    <span className="text-white/70 font-bold text-[9px] uppercase tracking-wider group-hover:text-white transition-colors">To'ldirish</span>
                                </button>

                                <button
                                    onClick={handleSend}
                                    className="group flex flex-col items-center gap-2 transition-all active:scale-90"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-xl group-hover:bg-blue-500 transition-all duration-500">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 group-hover:bg-white flex items-center justify-center shadow-lg transition-all duration-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </div>
                                    </div>
                                    <span className="text-white/70 font-bold text-[9px] uppercase tracking-wider group-hover:text-white transition-colors">Yuborish</span>
                                </button>

                                <button
                                    onClick={() => { setMarketTab(marketTab === 'buy' ? 'none' : 'buy'); fetchAds(); }}
                                    className="group flex flex-col items-center gap-2 transition-all active:scale-90"
                                >
                                    <div className={`w-14 h-14 rounded-2xl backdrop-blur-2xl border flex items-center justify-center shadow-xl transition-all duration-500 ${marketTab === 'buy' ? 'bg-indigo-500 border-indigo-400' : 'bg-white/10 border-white/20 group-hover:bg-indigo-500'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${marketTab === 'buy' ? 'bg-white text-indigo-500' : 'bg-indigo-500 text-white group-hover:bg-white group-hover:text-indigo-500'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        </div>
                                    </div>
                                    <span className="text-white/70 font-bold text-[9px] uppercase tracking-wider group-hover:text-white transition-colors">Sotib olish</span>
                                </button>

                                <button
                                    onClick={() => { setMarketTab(marketTab === 'sell' ? 'none' : 'sell'); fetchAds(); }}
                                    className="group flex flex-col items-center gap-2 transition-all active:scale-90"
                                >
                                    <div className={`w-14 h-14 rounded-2xl backdrop-blur-2xl border flex items-center justify-center shadow-xl transition-all duration-500 ${marketTab === 'sell' ? 'bg-amber-500 border-amber-400' : 'bg-white/10 border-white/20 group-hover:bg-amber-500'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${marketTab === 'sell' ? 'bg-white text-amber-500' : 'bg-amber-500 text-white group-hover:bg-white group-hover:text-amber-500'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>
                                    <span className="text-white/70 font-bold text-[9px] uppercase tracking-wider group-hover:text-white transition-colors">Sotish</span>
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setWithdrawError('');
                                    setWithdrawStatus('idle');
                                    setShowWithdrawModal(true);
                                }}
                                className="w-full mt-1 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-sm transition-all"
                            >
                                Naqdga yechish
                            </button>
                        </div>

                        {/* Mobile: 1 ta card (To'ldirish + Yuborish) va Naqdga yechish ham shu cardda */}
                        <div className="lg:hidden">
                            <GlassCard className="!p-3 !rounded-[1.25rem] bg-white/10 border-white/20 shadow-xl">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowTopUpModal(true)}
                                        className="group flex flex-col items-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-emerald-500 transition-all duration-500">
                                            <div className="w-7 h-7 rounded-full bg-emerald-500 group-hover:bg-white flex items-center justify-center shadow-md transition-all duration-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                        </div>
                                        <span className="text-white/70 font-bold text-[8px] uppercase tracking-wider group-hover:text-white transition-colors">To'ldirish</span>
                                    </button>

                                    <button
                                        onClick={handleSend}
                                        className="group flex flex-col items-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-blue-500 transition-all duration-500">
                                            <div className="w-7 h-7 rounded-full bg-blue-500 group-hover:bg-white flex items-center justify-center shadow-md transition-all duration-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                            </div>
                                        </div>
                                        <span className="text-white/70 font-bold text-[8px] uppercase tracking-wider group-hover:text-white transition-colors">Yuborish</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setWithdrawError('');
                                        setWithdrawStatus('idle');
                                        setShowWithdrawModal(true);
                                    }}
                                    className="w-full mt-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition-all"
                                >
                                    Naqdga yechish
                                </button>
                            </GlassCard>
                        </div>

                        {/* Mobile: 1 ta card (Sotib olish + Sotish) */}
                        <div className="lg:hidden">
                            <GlassCard className="!p-3 !rounded-[1.25rem] bg-white/10 border-white/20 shadow-xl">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => { setMarketTab(marketTab === 'buy' ? 'none' : 'buy'); fetchAds(); }}
                                        className="group flex flex-col items-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <div className={`w-11 h-11 rounded-xl backdrop-blur-2xl border flex items-center justify-center shadow-lg transition-all duration-500 ${marketTab === 'buy' ? 'bg-indigo-500 border-indigo-400' : 'bg-white/10 border-white/20 group-hover:bg-indigo-500'}`}>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-500 ${marketTab === 'buy' ? 'bg-white text-indigo-500' : 'bg-indigo-500 text-white group-hover:bg-white group-hover:text-indigo-500'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                        </div>
                                        <span className="text-white/70 font-bold text-[8px] uppercase tracking-wider group-hover:text-white transition-colors">Sotib olish</span>
                                    </button>

                                    <button
                                        onClick={() => { setMarketTab(marketTab === 'sell' ? 'none' : 'sell'); fetchAds(); }}
                                        className="group flex flex-col items-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <div className={`w-11 h-11 rounded-xl backdrop-blur-2xl border flex items-center justify-center shadow-lg transition-all duration-500 ${marketTab === 'sell' ? 'bg-amber-500 border-amber-400' : 'bg-white/10 border-white/20 group-hover:bg-amber-500'}`}>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-500 ${marketTab === 'sell' ? 'bg-white text-amber-500' : 'bg-amber-500 text-white group-hover:bg-white group-hover:text-amber-500'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                        </div>
                                        <span className="text-white/70 font-bold text-[8px] uppercase tracking-wider group-hover:text-white transition-colors">Sotish</span>
                                    </button>
                                </div>
                            </GlassCard>
                        </div>

                        <WalletHistoryCard transactions={transactions} />

                        {/* TRADE MONITORING & HISTORY */}
                        {myTrades.length > 0 && (
                            <div className="animate-fade-in space-y-3 lg:space-y-6 rounded-[1.25rem] lg:rounded-[24px] bg-white/5 border border-white/10 p-3 lg:p-0 lg:bg-transparent lg:border-0">
                                {/* Active Trades */}
                                {myTrades.some(t => t.status === 'pending') && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                                Faol Savdolar
                                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                            </h3>
                                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-amber-500/20">
                                                {myTrades.filter(t => t.status === 'pending').length} kutilmoqda
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {myTrades.filter(t => t.status === 'pending').map((trade: any) => {
                                                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                                const isSeller = trade.seller_id === (currentUser.id || currentUser.userId);
                                                return (
                                                    <GlassCard key={trade.id} className="p-5 border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-transparent hover:border-amber-500/30 transition-all duration-300">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-inner ${isSeller ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                                                    {isSeller ? 'S' : 'B'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-bold text-sm leading-tight">
                                                                        {isSeller ? `Xaridor: ${trade.buyer_name}` : `Sotuvchi: ${trade.seller_name}`}
                                                                    </p>
                                                                    <p className="text-white/30 text-[10px] mt-0.5">{new Date(trade.created_at).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-tighter mb-1">Summa</p>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-xl font-bold text-white tabular-nums">{parseFloat(trade.amount_mali).toLocaleString()}</span>
                                                                    <span className="text-[10px] text-emerald-400 font-black">MALI</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center bg-white/10 rounded-2xl p-3 border border-white/5">
                                                            <div className="flex gap-2 items-center">
                                                                <button
                                                                    onClick={() => handleTradeChat(trade.id)}
                                                                    className="p-2.5 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/20 active:scale-95"
                                                                    title="Chatga o'tish"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                                </button>
                                                                <div className="text-[10px] text-white/50">
                                                                    To'lov: <span className="text-white font-bold">{parseFloat(trade.amount_uzs).toLocaleString()} UZS</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {isSeller ? (
                                                                    <button
                                                                        onClick={() => handleConfirmTrade(trade.id)}
                                                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
                                                                    >
                                                                        To'lovni oldim
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-[10px] text-amber-400 bg-amber-400/10 px-3 py-2 rounded-xl border border-amber-400/20 font-medium">
                                                                        Tasdiqlash kutilmoqda
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => handleCancelTrade(trade.id)}
                                                                    className="p-2 bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-xl transition-all border border-white/5"
                                                                    title="Bekor qilish"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </GlassCard>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Trade History */}
                                <div className="space-y-3">
                                    <h3 className="text-white/70 font-bold text-sm px-1">Yaqindagi Tranzaksiyalar</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {myTrades.filter(t => t.status !== 'pending').slice(0, 5).map((trade: any) => {
                                            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                            const isSeller = trade.seller_id === (currentUser.id || currentUser.userId);
                                            const isCompleted = trade.status === 'completed';

                                            return (
                                                <div key={trade.id} className="group flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                            {isCompleted ? (isSeller ? '↑' : '↓') : '✕'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold text-sm">
                                                                {isSeller ? `Sotingiz: ${trade.buyer_name}` : `Sotib oldingiz: ${trade.seller_name}`}
                                                            </p>
                                                            <p className="text-[10px] text-white/20 uppercase tracking-widest">{new Date(trade.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-bold tabular-nums ${isCompleted ? (isSeller ? 'text-white' : 'text-emerald-400') : 'text-white/20 line-through'}`}>
                                                            {isSeller ? '-' : '+'}{parseFloat(trade.amount_mali).toLocaleString()} MALI
                                                        </p>
                                                        <p className="text-[10px] text-white/30">{parseFloat(trade.amount_uzs).toLocaleString()} UZS</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {marketTab !== 'none' && (
                            <div className="animate-fade-in mt-4 border-t border-white/10 pt-6 space-y-6">
                                <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 w-fit mx-auto">
                                    <button
                                        onClick={() => setMarketTab((marketTab.startsWith('my-') ? marketTab.replace('my-', '') : marketTab) as 'none' | 'buy' | 'sell' | 'my-buy' | 'my-sell')}
                                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${!marketTab.startsWith('my-') ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                                    >
                                        Bozor
                                    </button>
                                    <button
                                        onClick={() => setMarketTab(`my-${marketTab.replace('my-', '')}` as 'my-buy' | 'my-sell')}
                                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${marketTab.startsWith('my-') ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                                    >
                                        Mening E'lonlarim
                                    </button>
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">
                                            {marketTab.startsWith('my-') ? "Mening E'lonlarim" : (marketTab === 'buy' ? 'MALI Sotib Olish' : 'MALI Sotish')}
                                        </h3>
                                        <p className="text-white/40 text-xs">
                                            {marketTab.startsWith('my-') ? "Siz tomondan yaratilgan barcha takliflar" : (marketTab === 'buy' ? "Sotuvchilarning takliflari" : "Xaridorlarning takliflari")}
                                        </p>
                                    </div>
                                    {!marketTab.startsWith('my-') && (
                                        <GlassButton
                                            onClick={() => setShowCreateAd(!showCreateAd)}
                                            variant="premium"
                                            className="!py-2 !px-4 !rounded-lg !text-xs flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            {marketTab === 'buy' ? "Xarid E'loni Yaratish" : "Sotish E'loni Yaratish"}
                                        </GlassButton>
                                    )}
                                </div>

                                {showCreateAd && !marketTab.startsWith('my-') && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 animate-scale-in">
                                        <h4 className="text-white font-bold text-sm mb-3">Yangi E'lon Yaratish</h4>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="text-white/40 text-xs block mb-1">Miqdor (MALI)</label>
                                                <input type="number" placeholder="0.00" value={createAdData.amount} onChange={e => setCreateAdData({ ...createAdData, amount: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-white/40 text-xs block mb-1">Narx (UZS)</label>
                                                <input type="number" placeholder="4899" value={createAdData.price} onChange={e => setCreateAdData({ ...createAdData, price: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            </div>
                                        </div>
                                        <button onClick={handleCreateAd} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs">Joylashtirish</button>
                                    </div>
                                )}

                                {editingAd && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 animate-scale-in">
                                        <h4 className="text-amber-400 font-bold text-sm mb-3">E'lonni Tahrirlash</h4>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="text-white/40 text-[10px] block mb-1">Miqdor (MALI)</label>
                                                <input type="number" value={editingAd.amount_mali} onChange={e => setEditingAd({ ...editingAd, amount_mali: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-white/40 text-[10px] block mb-1">Narx (UZS)</label>
                                                <input type="number" value={editingAd.price_uzs} onChange={e => setEditingAd({ ...editingAd, price_uzs: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-white/40 text-[10px] block mb-1">Min Limit (UZS)</label>
                                                <input type="number" value={editingAd.min_limit_uzs} onChange={e => setEditingAd({ ...editingAd, min_limit_uzs: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-white/40 text-[10px] block mb-1">Max Limit (UZS)</label>
                                                <input type="number" value={editingAd.max_limit_uzs} onChange={e => setEditingAd({ ...editingAd, max_limit_uzs: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleUpdateAd} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg">Saqlash</button>
                                            <button onClick={() => setEditingAd(null)} className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs">Bekor qilish</button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar px-1">
                                    {marketTab.startsWith('my-') ? (
                                        myAds.length === 0 ? (
                                            <div className="text-center py-12 text-white/20 text-sm border-2 border-dashed border-white/5 rounded-2xl">
                                                Hali e'lonlaringiz mavjud emas.
                                            </div>
                                        ) : (
                                            myAds.map((ad) => (
                                                <div key={ad.id} className="group bg-[rgba(var(--glass-rgb),0.3)] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:bg-[rgba(var(--glass-rgb),0.4)] transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${ad.type === 'buy' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                {ad.type === 'buy' ? 'B' : 'S'}
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-bold text-sm capitalize">{ad.type === 'buy' ? 'Sotib olish' : 'Sotish'}</p>
                                                                <p className="text-[10px] text-white/30 uppercase tracking-widest">{new Date(ad.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-white font-black tabular-nums">{parseFloat(ad.amount_mali).toLocaleString()} MALI</p>
                                                            <p className="text-[10px] text-emerald-400 font-bold">@ {parseFloat(ad.price_uzs).toLocaleString()} UZS</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center bg-black/20 rounded-xl p-2 px-3 border border-white/5">
                                                        <div className="flex gap-2">
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${ad.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {ad.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {ad.status === 'active' && (
                                                                <button
                                                                    onClick={() => setEditingAd(ad)}
                                                                    className="p-2 bg-white/5 hover:bg-blue-500/20 text-white/30 hover:text-blue-400 rounded-lg transition-all border border-white/5"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteAd(ad.id)}
                                                                className="p-2 bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-lg transition-all border border-white/5"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        p2pAds.length === 0 ? (
                                            <div className="text-center py-12 text-white/20 text-sm border-2 border-dashed border-white/5 rounded-2xl">
                                                Hozircha e'lonlar yo'q. Birinchi bo'lib qo'shing!
                                            </div>
                                        ) : (
                                            p2pAds.map((ad) => (
                                                <div key={ad.id} className="group bg-[rgba(var(--glass-rgb),0.3)] border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-[rgba(var(--glass-rgb),0.4)] transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/5">
                                                            {ad.user_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold text-sm">{ad.user_name || 'User'}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-white/40 text-[10px]">{new Date(ad.created_at).toLocaleTimeString()}</p>
                                                                <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                                                <p className="text-[10px] text-emerald-400/60 font-medium">98% success</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className={`font-black tabular-nums text-lg ${marketTab === 'buy' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                                {parseFloat(ad.amount_mali).toLocaleString()} <span className="text-[10px] opacity-60">MALI</span>
                                                            </p>
                                                            <p className="text-white/30 text-[10px] font-bold">Narx: {parseFloat(ad.price_uzs).toLocaleString()} UZS</p>
                                                        </div>
                                                        <GlassButton
                                                            onClick={() => handleTrade(ad)}
                                                            variant="premium"
                                                            className="!py-2.5 !px-6 !rounded-xl !text-xs flex items-center justify-center"
                                                        >
                                                            {marketTab === 'buy' ? 'Sotib olish' : 'Sotish'}
                                                        </GlassButton>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="text-center pt-4">
                            <button onClick={handleRecovery} className="text-white/30 text-xs hover:text-white hover:underline transition-colors">
                                Forgot PIN? Start Recovery Process
                            </button>
                        </div>
                    </div>
            </div>

            {showTopUpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
                    <GlassCard className="w-full max-w-md !p-0 overflow-hidden relative shadow-2xl animate-scale-in">
                        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Hisobni to'ldirish</h2>
                            <p className="text-white/60 text-sm">Admin kartasiga pul o'tkazing</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-5 rounded-2xl shadow-xl relative overflow-hidden border border-white/10 group cursor-pointer hover:scale-[1.02] transition-transform">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-white/80 font-medium tracking-wider">UZCARD</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                </div>
                                <div className="space-y-1 text-center py-2">
                                    <p className="text-2xl font-mono text-white tracking-[0.15em] drop-shadow-md">
                                        {walletConfig.adminCard || 'Karta raqami sozlanmagan'}
                                    </p>
                                    <p className="text-white/60 text-sm uppercase tracking-widest mt-2">MALI ADMIN</p>
                                </div>
                            </div>
                            {topUpStatus === 'success' ? (
                                <div className="text-center py-4 space-y-2">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    <h3 className="text-white font-bold text-lg">So'rov yuborildi!</h3>
                                    <p className="text-white/50 text-sm">Admin tasdiqlashini kuting.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">O'tkazilgan Summa (MALI)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={topUpAmount}
                                                onChange={(e) => setTopUpAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-mono placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">MALI</span>
                                        </div>
                                    </div>
                                    {topUpError && (
                                        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                                            {topUpError}
                                        </p>
                                    )}
                                    <p className="text-xs text-white/40 text-center">
                                        To'g'ridan to'g'ri MALI summasini kiriting.
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[50, 100, 200].map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => setTopUpAmount(String(preset))}
                                                className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs border border-white/10"
                                            >
                                                {preset} MALI
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setShowTopUpModal(false)} className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-all">Yopish</button>
                                        <button onClick={transformTopUp} disabled={topUpStatus === 'loading'} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                            {topUpStatus === 'loading' ? 'Yuborilmoqda...' : 'Tasdiqlash'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
                    <GlassCard className="w-full max-w-md !p-0 overflow-hidden relative shadow-2xl animate-scale-in">
                        <div className="bg-gradient-to-r from-rose-900/40 to-orange-900/40 p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Naqdga yechish</h2>
                            <p className="text-white/60 text-sm">Yechish so'rovini yuborish</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {withdrawStatus === 'success' ? (
                                <div className="text-center py-5 space-y-2">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white">✓</div>
                                    <h3 className="text-white font-bold text-lg">So'rov yuborildi</h3>
                                    <p className="text-white/50 text-sm">Operator siz bilan bog'lanadi.</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Summa (MALI)</label>
                                        <input
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Karta raqami</label>
                                        <input
                                            type="text"
                                            value={withdrawCard}
                                            onChange={(e) => setWithdrawCard(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                            placeholder="8600 0000 0000 0000"
                                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">PIN (4 xonali)</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={withdrawPin}
                                            onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="****"
                                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        />
                                    </div>
                                    <p className="text-xs text-white/50">
                                        Balans: {balance.available.toLocaleString()} MALI. Min: {MIN_WITHDRAW} MALI
                                    </p>
                                    <p className="text-xs text-amber-200/80">
                                        Tizimdagi mavjud MALI: {walletConfig.systemAvailableMali.toLocaleString()}
                                    </p>
                                    {withdrawError && (
                                        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                                            {withdrawError}
                                        </p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <button
                                            onClick={() => setShowWithdrawModal(false)}
                                            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10"
                                        >
                                            Yopish
                                        </button>
                                        <button
                                            onClick={handleWithdraw}
                                            disabled={withdrawStatus === 'loading'}
                                            className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-60"
                                        >
                                            {withdrawStatus === 'loading' ? "Yuborilmoqda..." : "So'rov yuborish"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
            {showSendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-3">
                    <GlassCard className="w-full max-w-md !p-0 overflow-hidden relative shadow-2xl animate-scale-in">
                        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-5 border-b border-white/10">
                            <h2 className="text-lg sm:text-xl font-bold text-white">MALI yuborish</h2>
                            <p className="text-white/60 text-xs sm:text-sm">Kontakt tanlang va summani kiriting</p>
                        </div>
                        <div className="p-4 sm:p-6 space-y-4">
                            {sendStatus === 'success' ? (
                                <div className="text-center py-5 space-y-2">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white">✓</div>
                                    <h3 className="text-white font-bold text-lg">Muvaffaqiyatli yuborildi</h3>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Kontakt qidirish</label>
                                        <input
                                            type="text"
                                            value={sendSearch}
                                            onChange={(e) => setSendSearch(e.target.value)}
                                            placeholder="Ism yoki telefon"
                                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Kontakt</label>
                                        <div className="mt-1 max-h-40 overflow-y-auto border border-white/10 rounded-xl bg-white/5">
                                            {contacts
                                                .filter((c) => {
                                                    const q = sendSearch.trim().toLowerCase();
                                                    if (!q) return true;
                                                    return (c.name || '').toLowerCase().includes(q) || String(c.phone || '').includes(q);
                                                })
                                                .map((contact: any) => (
                                                    <button
                                                        key={contact.id}
                                                        onClick={() => setSendRecipientId(contact.id)}
                                                        className={`w-full px-3 py-2 text-left text-sm border-b border-white/5 last:border-b-0 ${
                                                            sendRecipientId === contact.id ? 'bg-blue-500/20 text-white' : 'text-white/80 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {(contact.name || 'Kontakt')} {contact.surname || ''} {contact.phone ? `(${contact.phone})` : ''}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Summa (MALI)</label>
                                        <input
                                            type="number"
                                            value={sendAmount}
                                            onChange={(e) => setSendAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">PIN (4 xonali)</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={sendPin}
                                            onChange={(e) => setSendPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="****"
                                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Izoh (ixtiyoriy)</label>
                                        <input
                                            type="text"
                                            value={sendNote}
                                            onChange={(e) => setSendNote(e.target.value)}
                                            placeholder="Xizmat uchun to'lov"
                                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        />
                                    </div>
                                    {sendError && (
                                        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                                            {sendError}
                                        </p>
                                    )}
                                    <p className="text-xs text-white/50">Mavjud balans: {balance.available.toLocaleString()} MALI</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setShowSendModal(false)}
                                            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10"
                                        >
                                            Yopish
                                        </button>
                                        <button
                                            onClick={submitSend}
                                            disabled={sendStatus === 'loading'}
                                            className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-60"
                                        >
                                            {sendStatus === 'loading' ? "Yuborilmoqda..." : "Yuborish"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}

