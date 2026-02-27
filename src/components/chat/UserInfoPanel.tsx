import React, { useEffect, useState } from 'react';
import {
    X, MessageCircle, Bell, Gift, Link, Mic, Users, Edit3, Trash2, ShieldAlert, Check, Loader2
} from 'lucide-react';

interface UserInfoPanelProps {
    chat: any;
    onClose?: () => void;
}

export default function UserInfoPanel({ chat, onClose }: UserInfoPanelProps) {
    const [loading, setLoading] = useState(false);
    const [fullUserDetails, setFullUserDetails] = useState<any>(null);
    const [stats, setStats] = useState({ linksCount: 0, voiceCount: 0, commonGroupsCount: 0 });
    const [isBlocked, setIsBlocked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', surname: '' });
    const [imgError, setImgError] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (chat) {
            fetchUserDetails();
            fetchChatStats();
        }
    }, [chat?.id]);

    const fetchUserDetails = async () => {
        if (!chat) return;
        setLoading(true);
        setImgError(false);
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';
            const targetId = chat.participantId || chat.otherUser?.id || chat.userId || chat.id;
            const res = await fetch(`${API_URL}/api/users/${targetId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFullUserDetails(data);
                setEditForm({ name: data.name || '', surname: data.surname || '' });
                setIsBlocked(data.isBlocked || false);
            }
        } catch (err) {
            console.error("Failed to fetch user details:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchChatStats = async () => {
        if (!chat?.id || chat.type !== 'private') return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/users/chat-stats/${chat.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch chat stats:", err);
        }
    };

    const handleBlock = async () => {
        setActionLoading('block');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';
            const targetId = chat.participantId || chat.otherUser?.id || chat.userId || chat.id;
            const res = await fetch(`${API_URL}/api/users/${isBlocked ? 'unblock' : 'block'}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetId })
            });
            if (res.ok) {
                setIsBlocked(!isBlocked);
                window.dispatchEvent(new CustomEvent('block_status_changed'));
            }
        } catch (e) { console.error(e); } finally { setActionLoading(null); }
    };

    const handleUpdateContact = async () => {
        setActionLoading('edit');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';
            const targetId = chat.participantId || chat.otherUser?.id || chat.userId || chat.id;
            const res = await fetch(`${API_URL}/api/users/contacts`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contactUserId: targetId, ...editForm })
            });
            if (res.ok) {
                setIsEditing(false);
                fetchUserDetails();
                // Optionally broadcast local change to parent or window
                window.dispatchEvent(new CustomEvent('contacts_updated'));
            }
        } catch (e) { console.error(e); } finally { setActionLoading(null); }
    };

    const handleDeleteContact = async () => {
        if (!confirm('Haqiqatan ham ushbu kontaktni va barcha yozishmalarni butunlay o\'chirib tashlamoqchimisiz? Ikkala tomon uchun ham o\'chiriladi.')) return;
        setActionLoading('delete');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';
            const targetId = chat.participantId || chat.otherUser?.id || chat.userId || chat.id;
            const res = await fetch(`${API_URL}/api/users/contacts/${targetId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onClose?.();
                window.dispatchEvent(new CustomEvent('chat_deleted', { detail: { chatId: chat.id } }));
            }
        } catch (e) { console.error(e); } finally { setActionLoading(null); }
    };

    if (!chat) return null;

    const user = fullUserDetails || chat;
    const rawAvatar = user.avatar || user.avatar_url;
    const avatarUrl = rawAvatar && rawAvatar !== 'null' && rawAvatar !== ''
        ? (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:') ? rawAvatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${rawAvatar}`)
        : null;

    const initials = user.name ? user.name.substring(0, 1).toUpperCase() : '?';
    const hasPhone = user.phone && user.phone !== 'Скрыт';
    const username = user.username ? `@${user.username}` : '';

    return (
        <div className="fixed lg:relative inset-0 lg:inset-auto z-[70] lg:z-0 h-full w-full flex flex-col bg-[#788296]/25 lg:bg-transparent backdrop-blur-[20px] lg:backdrop-blur-none border-l-0 lg:border-l lg:border-white/20 overflow-hidden animate-slide-left select-none relative">
            <div className="lg:hidden absolute inset-0 bg-slate-900/40 -z-10" />

            {/* Close Button Top Right */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
                <X className="h-6 w-6" />
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Header Section */}
                <div className="flex flex-col items-center pt-10 pb-6 px-4">
                    <div className="relative mb-4">
                        <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-blue-400 to-indigo-500 shadow-2xl overflow-hidden flex items-center justify-center text-white text-3xl font-bold">
                            {avatarUrl && !imgError ? (
                                <img
                                    src={avatarUrl}
                                    className="w-full h-full rounded-full object-cover border-4 border-[#788296]/30"
                                    alt={user.name}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="w-full max-w-[200px] flex flex-col gap-2 animate-in fade-in zoom-in duration-200">
                            <input
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Ism"
                                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-blue-500/50"
                            />
                            <input
                                value={editForm.surname}
                                onChange={e => setEditForm({ ...editForm, surname: e.target.value })}
                                placeholder="Familiya"
                                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-blue-500/50"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(false)} className="flex-1 py-1 text-xs text-white/40 hover:text-white">Bekor qilish</button>
                                <button onClick={handleUpdateContact} disabled={actionLoading === 'edit'} className="flex-1 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 text-xs rounded-lg flex items-center justify-center gap-1">
                                    {actionLoading === 'edit' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    Saqlash
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-white text-center leading-tight">
                                {user.name} {user.surname || ''}
                            </h2>
                            {username && (
                                <p className="text-white/40 text-sm mt-0.5 font-medium">
                                    {username}
                                </p>
                            )}
                        </>
                    )}

                    <p className="text-blue-400/60 text-[13px] mt-1 font-medium">
                        yaqinda tarmoqda edi
                    </p>
                </div>

                {/* Quick Action Buttons Row */}
                <div className="flex justify-center gap-2 px-4 mb-8">
                    <ActionButton icon={<MessageCircle className="h-5 w-5" />} label="Suhbat" />
                    <ActionButton icon={<Bell className="h-5 w-5" />} label="Ovoz" />
                    <ActionButton icon={<Gift className="h-5 w-5" />} label="Sovg'a" />
                </div>

                {/* Information Section */}
                <div className="w-full space-y-1">
                    <div className="px-6 py-4 border-t border-white/5">
                        <h3 className="text-white text-[15px] font-medium">
                            {hasPhone ? user.phone : 'Yashirilgan'}
                        </h3>
                        <p className="text-blue-400/40 text-xs">Telefon raqami</p>
                    </div>

                    {user.bio && (
                        <>
                            <div className="h-px bg-white/5 mx-2" />
                            <div className="px-6 py-4">
                                <h3 className="text-white text-[14px] leading-relaxed">
                                    {user.bio}
                                </h3>
                                <p className="text-blue-400/40 text-xs mt-1">Biografiya</p>
                            </div>
                        </>
                    )}

                    <div className="h-px bg-white/5 mx-2" />

                    <div className="py-2">
                        <MenuItem
                            icon={<Link className="h-5 w-5" />}
                            label={`${stats.linksCount} ta havola`}
                        />
                        <MenuItem
                            icon={<Mic className="h-5 w-5" />}
                            label={`${stats.voiceCount} ta ovozli xabar`}
                        />
                        <MenuItem
                            icon={<Users className="h-5 w-5" />}
                            label={`${stats.commonGroupsCount} ta umumiy guruh`}
                        />
                    </div>

                    <div className="h-px bg-white/5 mx-2" />

                    <div className="py-2 pb-10">
                        <MenuItem
                            icon={<Edit3 className="h-5 w-5" />}
                            label="Kontaktni tahrirlash"
                            onClick={() => setIsEditing(true)}
                        />
                        <MenuItem
                            icon={actionLoading === 'delete' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                            label="Kontaktni o'chirish"
                            onClick={handleDeleteContact}
                        />
                        <MenuItem
                            icon={actionLoading === 'block' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5 text-rose-500" />}
                            label={isBlocked ? "Blokdan chiqarish" : "Bloklash"}
                            className="text-rose-500"
                            onClick={handleBlock}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex-1 flex flex-col items-center gap-2 px-2 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group"
        >
            <div className="text-white/70 group-hover:text-white transition-colors">
                {icon}
            </div>
            <span className="text-[11px] font-medium text-white/40 group-hover:text-white/60">
                {label}
            </span>
        </button>
    );
}

function MenuItem({ icon, label, onClick, className = "" }: { icon: React.ReactNode, label: string, onClick?: () => void, className?: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors group ${className}`}
        >
            <div className="w-6 flex items-center justify-center text-white/30 group-hover:text-white/60 transition-colors">
                {icon}
            </div>
            <span className="text-[14px] font-medium text-white/80 group-hover:text-white">
                {label}
            </span>
        </button>
    );
}

