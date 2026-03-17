
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import JobsPanel from '../jobs/JobsPanel';
import { useSocket } from '@/context/SocketContext';
import {
    Globe,
    User,
    Wallet,
    Users,
    Radio,
    Bot,
    LayoutGrid,
    Briefcase,
    ShieldCheck,
    LineChart,
    CircleUser,
    Megaphone,
    Phone,
    Settings,
    Moon,
    Search,
    Menu,
    Plus,
    LogOut,
    UserPlus,
    MessageCircle,
    Hash,
    Contact,
    X,
    UserCircle,
    PhoneCall,
    Bookmark,
    HelpCircle,
    Layout,
    PenSquare,
    Bell
} from 'lucide-react';

export const CATEGORIES = [
    {
        id: 'all', label: '', icon: <Globe className="h-6 w-6" />
    },
    {
        id: 'user', label: '', icon: <User className="h-6 w-6" />
    },
    {
        id: 'wallet', label: '', icon: <Wallet className="h-6 w-6" />
    },
    {
        id: 'group', label: '', icon: <Users className="h-6 w-6" />
    },
    {
        id: 'channel', label: '', icon: <Radio className="h-6 w-6" />
    },
    {
        id: 'bot', label: '', icon: <Bot className="h-6 w-6" />
    },
    {
        id: 'communities', label: '', icon: <LayoutGrid className="h-6 w-6" />
    },
    {
        id: 'services', label: '', icon: <Briefcase className="h-6 w-6" />
    },
    {
        id: 'jobs', label: '', icon: <ShieldCheck className="h-6 w-6" />
    },
    {
        id: 'finance', label: '', icon: <LineChart className="h-6 w-6" />
    }
];

interface ChatListProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    onChatSelect?: (chat: any) => void;
    onExpertSelect?: (expert: any) => void;
    className?: string;
    hideHeader?: boolean;
    hideCategories?: boolean;
    // Lifted State
    showMenu: boolean;
    setShowMenu: (show: boolean) => void;
    showContactModal: boolean;
    setShowContactModal: (show: boolean) => void;
    showGroupModal: boolean;
    setShowGroupModal: (show: boolean) => void;
    showCreateChannelModal: boolean;
    setShowCreateChannelModal: (show: boolean) => void;
    showContactsModal: boolean;
    setShowContactsModal: (show: boolean) => void;
    currentUser: any;
    chats: any[];
    contacts: any[];
    loading: boolean;
    handleAddContact: (user: any) => void;
    handleSupport: () => void;
    handleDeleteContact: (id: string) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    searchResults: any[];
    isSearching: boolean;
    isExpertMode?: boolean;
    onToggleExpertMode?: () => void;
    showNotifications?: boolean;
    setShowNotifications?: (show: boolean) => void;
    unreadCount?: number;
}

export default function ChatList({
    activeCategory = 'all',
    onCategoryChange,
    onChatSelect,
    onExpertSelect,
    className,
    hideHeader = false,
    hideCategories = false,
    showMenu,
    setShowMenu,
    showContactModal,
    setShowContactModal,
    showGroupModal,
    setShowGroupModal,
    showCreateChannelModal,
    setShowCreateChannelModal,
    showContactsModal,
    setShowContactsModal,
    currentUser,
    chats,
    contacts,
    loading,
    handleAddContact,
    handleSupport,
    handleDeleteContact,
    searchQuery,
    onSearchChange,
    searchResults,
    isSearching,
    isExpertMode,
    onToggleExpertMode,
    showNotifications,
    setShowNotifications,
    unreadCount = 0
}: ChatListProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Swipe navigation (mobile) between categories
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleCategoryChange = (catId: string) => {
        if (onCategoryChange) onCategoryChange(catId);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX.current;
        const dy = touch.clientY - touchStartY.current;
        touchStartX.current = null;
        touchStartY.current = null;

        // Only react to gorizontal, yetarli uzun swipe
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

        const currentIndex = CATEGORIES.findIndex(c => c.id === activeCategory);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (dx < 0) {
            // Chapga swipe → keyingi kategoriya
            nextIndex = Math.min(CATEGORIES.length - 1, currentIndex + 1);
        } else if (dx > 0) {
            // O'ngga swipe → oldingi kategoriya
            nextIndex = Math.max(0, currentIndex - 1);
        }
        if (nextIndex !== currentIndex) {
            handleCategoryChange(CATEGORIES[nextIndex].id);
        }
    };

    // FILTER CHATS
    const filteredChats = searchQuery
        ? searchResults
        : (activeCategory === 'jobs' || activeCategory === 'all')
            ? chats
            : (activeCategory === 'contacts'
                ? contacts
                : (chats || []).filter((chat: any) => {
                    if (activeCategory === 'user') return chat.type === 'private' || !chat.type;
                    return chat.type === activeCategory;
                }));

    const [expertCards, setExpertCards] = useState<any[]>([]);
    const [expertLoading, setExpertLoading] = useState(false);

    useEffect(() => {
        const loadExperts = async () => {
            if (activeCategory !== 'services') return;
            try {
                setExpertLoading(true);
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const res = await fetch(`${API_URL}/api/users/search?expert=true`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined
                });
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data)) {
                    setExpertCards(data.filter((u: any) => u.verified_status === 'approved'));
                }
            } catch (e) {
                console.error('Failed to load experts for sidebar:', e);
            } finally {
                setExpertLoading(false);
            }
        };
        loadExperts();
    }, [activeCategory]);

    const getCategoryUnreadCount = (catId: string) => {
        if (catId === 'all') {
            return (chats || []).reduce((acc: number, chat: any) => acc + (chat.unread || 0), 0);
        }
        if (catId === 'jobs' || catId === 'finance' || catId === 'services' || catId === 'communities') return 0;

        return (chats || [])
            .filter((chat: any) => {
                if (catId === 'user') return chat.type === 'private' || !chat.type;
                return chat.type === catId;
            })
            .reduce((acc: number, chat: any) => acc + (chat.unread || 0), 0);
    };

    return (
        <div className={`h-full flex flex-col relative overflow-hidden select-none animate-fade-in rounded-3xl ${className || ''}`}>
            {/* iOS Style Sidebar Drawer */}

            {/* Sticky Header / Search / Categories Container */}
            <div className={`sticky top-0 z-20 backdrop-blur-xl border-b border-white/5 bg-white/15 ${(hideHeader && hideCategories) ? 'hidden lg:block' : 'block'}`}>
                {/* Header / Search部 */}
                <div className={`p-4 flex-col gap-4 ${hideHeader ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <button
                            onClick={() => setShowContactModal(true)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
                        >
                            <PenSquare className="h-5 w-5" />
                        </button>

                        {mounted && currentUser?.is_expert ? (
                            <button
                                onClick={onToggleExpertMode}
                                title={isExpertMode ? "Mijoz ko'rinishi" : "Ekspert paneli"}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isExpertMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                            >
                                <Layout className="h-5 w-5" />
                            </button>
                        ) : null}
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-white/30" />
                        </div>
                        <input
                            type="text"
                            placeholder="Foydalanuvchi nomi (@username)"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border-none outline-none text-white rounded-full py-2.5 pl-11 pr-4 placeholder-white/30 text-sm transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories - Horizontally scrollable on all devices */}
                <div className={`flex gap-4 overflow-x-auto no-scrollbar mask-overflow mb-2 flex-nowrap shrink-0 px-4 py-3 border-b border-white/5 ${hideCategories ? 'hidden lg:flex' : 'flex'}`}>
                    {CATEGORIES.map(cat => {
                        const count = getCategoryUnreadCount(cat.id);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryChange(cat.id)}
                                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-transform transition-colors duration-300 relative
                                    ${activeCategory === cat.id
                                        ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/30 scale-105'
                                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:scale-105 active:scale-95'
                                    }`}
                            >
                                <div className="w-5 h-5">{cat.icon}</div>
                                {count > 0 && (
                                    <div className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 rounded-full bg-red-500 border-2 border-[#1a1c2e] flex items-center justify-center text-[9px] font-bold text-white px-1 shadow-lg">
                                        {count > 99 ? '99+' : count}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto px-3 pt-3 space-y-3 custom-scrollbar"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {activeCategory === 'services' ? (
                    expertLoading ? (
                        <div className="pt-3 space-y-3">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="animate-pulse rounded-2xl border border-white/10 bg-white/5 px-3 py-3 flex items-center gap-3"
                                >
                                    <div className="h-10 w-10 rounded-full bg-white/10" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-1/2 rounded-full bg-white/10" />
                                        <div className="h-2 w-3/4 rounded-full bg-white/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : expertCards.length > 0 ? (
                        expertCards.map((exp, index) => (
                            <div key={exp.id || index} className="px-1">
                                <GlassCard
                                    onClick={() => onExpertSelect && onExpertSelect(exp)}
                                    hoverEffect={true}
                                    className="flex items-center gap-3 !p-4 !bg-white/[0.06] hover:!bg-white/10 !rounded-[1.5rem] border border-emerald-500/20 transition-all active:scale-[0.98]"
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center text-white font-bold text-lg">
                                            {exp.avatar_url ? (
                                                <img src={exp.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                (exp.name || '?').substring(0, 1).toUpperCase()
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className="text-white font-medium truncate text-sm">
                                                {exp.name} {exp.surname}
                                            </h3>
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 font-bold uppercase tracking-widest">
                                                Approved
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-blue-300 font-semibold uppercase tracking-widest truncate">
                                            {exp.profession}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] text-white/40">
                                                {(exp.experience_years || 0)} yil tajriba
                                            </span>
                                            <span className="text-[11px] text-emerald-300 font-bold">
                                                {(exp.hourly_rate || exp.service_price || 0)} MALI
                                            </span>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-white/40 mt-10">
                            <p className="text-sm">Hozircha tasdiqlangan e'lonlar yo'q</p>
                        </div>
                    )
                ) : loading ? (
                    <div className="pt-3 space-y-3">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="animate-pulse rounded-2xl border border-white/10 bg-white/5 px-3 py-3 flex items-center gap-3"
                            >
                                <div className="h-10 w-10 rounded-full bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/2 rounded-full bg-white/10" />
                                    <div className="h-2 w-3/4 rounded-full bg-white/5" />
                                </div>
                                <div className="h-3 w-8 rounded-full bg-white/10" />
                            </div>
                        ))}
                    </div>
                ) : filteredChats.length > 0 ? (
                    filteredChats.map((chat, index) => {
                        const myId = currentUser?.id;
                        const isTrade = chat.isTrade;
                        const isUsernameSearchResult = searchQuery && (chat.type === 'contact' || chat.isGlobal) && (chat.username || chat.message === 'Foydalanuvchi nomi');
                        let displayName = isUsernameSearchResult ? `@${chat.username}` : chat.name;
                        let subtitle = isTrade ? 'Savdo muloqoti' : (chat.message?.includes('darsni boshladi') && !chat.message?.startsWith('🚀') ? `🚀 ${chat.message}` : chat.message);
                        if (isUsernameSearchResult) subtitle = 'Foydalanuvchi nomi';

                        if (isTrade) {
                            displayName = chat.participants?.indexOf(myId) === 0 ? "Xaridor" : "Sotuvchi";
                        }

                        return (
                            <div key={chat.id || chat._id || index} className="px-1">
                                <GlassCard
                                    onClick={() => chat.type === 'contact' || chat.isGlobal ? handleAddContact(chat) : (onChatSelect && onChatSelect(chat))}
                                    hoverEffect={true}
                                    className={`flex items-center gap-3 !p-4 !bg-white/[0.05] hover:!bg-white/10 !rounded-[1.5rem] border-transparent transition-all active:scale-[0.98] animate-slide-up`}
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden ${isTrade ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-white/10'}`}>
                                            {(() => {
                                                const avatar = chat.avatar || chat.avatar_url || chat.otherUser?.avatar || chat.otherUser?.avatar_url;
                                                if (avatar && avatar !== 'null' && avatar !== '' && avatar !== 'use_initials' && !isTrade) {
                                                    const src = avatar.startsWith('http') || avatar.startsWith('data:')
                                                        ? avatar
                                                        : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app'}/${avatar}`;
                                                    return (
                                                        <img
                                                            src={src}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).parentElement!.innerText = displayName ? displayName.substring(0, 1).toUpperCase() : '?';
                                                            }}
                                                        />
                                                    );
                                                }
                                                return displayName ? displayName.replace(/^@/, '').substring(0, 1).toUpperCase() : '?';
                                            })()}
                                        </div>
                                        {chat.status === 'online' && !isTrade && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-[#1a1c2e]"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="text-white font-medium truncate text-sm">{displayName}</h3>
                                            <span className="text-[10px] text-white/30 uppercase tracking-tighter">{chat.time}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-white/50 truncate group-hover:text-white/70 transition-colors">
                                                {subtitle}
                                            </p>
                                            {chat.unread > 0 && (
                                                <div className="min-w-[1.25rem] h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white px-1 shadow-lg shadow-blue-500/20">
                                                    {chat.unread}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-white/40 mt-10">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            {isSearching ? <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div> : <Plus className="h-8 w-8 text-white/20" />}
                        </div>
                        <p className="text-sm">{isSearching ? 'Qidirilmoqda...' : (searchQuery ? 'Hech narsa topilmadi' : 'Hali chatlar yo\'q')}</p>
                    </div>
                )}
            </div>

            {/* Plus: kichik ekranda o‘ngda, pastda, lekin pastdagi nav (72px) ustiga chiqmasin */}
            <button
                onClick={() => setShowContactModal(true)}
                className="absolute right-3 bottom-[calc(72px+0.25rem)] sm:bottom-4 sm:right-4 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_10px_30px_rgba(16,185,129,0.45)] flex items-center justify-center transition-transform active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div >
    );
}

