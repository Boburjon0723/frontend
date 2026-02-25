
import React, { useState, useEffect } from 'react';
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
    PenSquare
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
}

export default function ChatList({
    activeCategory = 'all',
    onCategoryChange,
    onChatSelect,
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
    isSearching
}: ChatListProps) {
    const handleCategoryChange = (catId: string) => {
        if (onCategoryChange) onCategoryChange(catId);
    };

    // FILTER CHATS
    const filteredChats = searchQuery
        ? searchResults
        : (activeCategory === 'jobs' || activeCategory === 'all')
            ? chats
            : (activeCategory === 'contacts'
                ? contacts
                : chats.filter(chat => {
                    if (activeCategory === 'user') return chat.type === 'private' || !chat.type;
                    return chat.type === activeCategory;
                }));


    return (
        <div className={`h-full flex flex-col relative overflow-hidden select-none animate-fade-in glass-premium !rounded-none !border-y-0 !border-l-0 ${className || ''}`}>
            {/* iOS Style Sidebar Drawer */}

            {/* Sticky Header / Search / Categories Container */}
            <div className={`sticky top-0 z-20 backdrop-blur-xl border-b border-white/5 ${(hideHeader && hideCategories) ? 'hidden lg:block' : 'block'}`}>
                {/* Header / Search部 */}
                <div className={`p-4 lg:pt-6 flex-col gap-4 ${hideHeader ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
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
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-white/30" />
                        </div>
                        <input
                            type="text"
                            placeholder="Qidirish"
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
                <div className={`gap-4 overflow-x-auto px-4 py-3 no-scrollbar mask-overflow mb-2 flex-nowrap border-b border-white/5 ${hideCategories ? 'hidden lg:flex' : 'flex'}`}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${activeCategory === cat.id ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/40 scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                        >
                            <div className="w-6 h-6">{cat.icon}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-10 text-white/40">Loading...</div>
                ) : filteredChats.length > 0 ? (
                    filteredChats.map((chat, index) => {
                        const myId = currentUser?.id;
                        const isTrade = chat.isTrade;
                        let displayName = chat.name;

                        if (isTrade) {
                            displayName = chat.participants?.indexOf(myId) === 0 ? "Xaridor" : "Sotuvchi";
                        }

                        return (
                            <div key={chat.id || chat._id || index} className="px-1">
                                <GlassCard
                                    onClick={() => chat.type === 'contact' || chat.isGlobal ? handleAddContact(chat) : (onChatSelect && onChatSelect(chat))}
                                    hoverEffect={true}
                                    className={`flex items-center gap-3 !p-4 !bg-white/[0.05] hover:!bg-white/10 !rounded-[1.5rem] border-transparent transition-all active:scale-[0.98] ${chat.unread > 0 ? '!bg-white/10 shadow-lg shadow-black/small' : ''}`}
                                >
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden ${isTrade ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-white/10'}`}>
                                            {(() => {
                                                const avatar = chat.avatar || chat.otherUser?.avatar || chat.otherUser?.avatar_url;
                                                if (avatar && avatar !== 'null' && avatar !== '' && avatar !== 'use_initials' && !isTrade) {
                                                    const src = avatar.startsWith('http') || avatar.startsWith('data:')
                                                        ? avatar
                                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app'}/${avatar}`;
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
                                                return displayName ? displayName.substring(0, 1).toUpperCase() : '?';
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
                                            <p className="text-xs text-white/50 truncate group-hover:text-white/70 transition-colors">{isTrade ? 'Savdo muloqoti' : chat.message}</p>
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

            <button onClick={() => setShowContactModal(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[var(--accent-purple-start)] to-[var(--accent-purple-end)] rounded-full shadow-[0_0_20px_rgba(124,77,255,0.4)] flex items-center justify-center text-white hover:scale-110 transition-transform z-30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
        </div >
    );
}
