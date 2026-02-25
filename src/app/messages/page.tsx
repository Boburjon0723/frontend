"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChatList, { CATEGORIES } from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import GroupInfoPanel from "@/components/chat/GroupInfoPanel";
import ServicesList from "@/components/chat/ServicesList";
import ProfileViewer from "@/components/chat/ProfileViewer";
import ProfileEditor from "@/components/chat/ProfileEditor";
import WalletPanel from "@/components/chat/WalletPanel";
import ExpenseTracker from "@/components/chat/ExpenseTracker";
import CommunitiesList from "@/components/chat/CommunitiesList";
import ChannelInfoPanel from "@/components/chat/ChannelInfoPanel";
import UserInfoPanel from "@/components/chat/UserInfoPanel";
import AddContactModal from "@/components/chat/AddContactModal";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import CreateChannelModal from "@/components/chat/CreateChannelModal";
import ContactsModal from "@/components/chat/ContactsModal";
import { useSocket } from "@/context/SocketContext";
import {
    Menu as MenuIcon,
    PenSquare,
    Search,
    X,
    UserCircle,
    Wallet,
    HelpCircle,
    Users,
    Megaphone,
    Contact,
    PhoneCall,
    Bookmark,
    Settings,
    Moon,
    LogOut
} from "lucide-react";

export default function MessagesPage() {
    const { socket } = useSocket();

    // Core State
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Modal & Menu Visibility State
    const [showMenu, setShowMenu] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
    const [showContactsModal, setShowContactsModal] = useState(false);

    // BACKGROUND & THEME SETTINGS
    const [bgBlur, setBgBlur] = useState(8);
    const [bgImage, setBgImage] = useState("https://wallpapers.com/images/hd/beautiful-mountain-range-4k-scenic-nature-view-nx19pueiwl8x9vsw.jpg");
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const savedBlur = localStorage.getItem('app-bg-blur');
        const savedImage = localStorage.getItem('app-bg-image');
        const savedTheme = localStorage.getItem('app-theme');
        if (savedBlur) setBgBlur(parseInt(savedBlur));
        if (savedImage) setBgImage(savedImage);
        if (savedTheme) setIsDarkMode(savedTheme === 'dark');
    }, []);

    const updateBgBlur = (val: number) => {
        setBgBlur(val);
        localStorage.setItem('app-bg-blur', val.toString());
    };

    const updateBgImage = (url: string) => {
        setBgImage(url);
        localStorage.setItem('app-bg-image', url);
    };

    const updateTheme = (dark: boolean) => {
        setIsDarkMode(dark);
        localStorage.setItem('app-theme', dark ? 'dark' : 'light');
    };

    // FETCH CHATS
    const fetchChats = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("[MessagesPage] No token found, redirecting to auth");
            setLoading(false);
            window.location.href = '/auth';
            return;
        }
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mappedChats = data.map((chat: any) => ({
                    ...chat,
                    id: chat.id || chat._id,
                    name: chat.type === 'group' ? chat.name : (chat.otherUser?.name ? `${chat.otherUser.name} ${chat.otherUser.surname || ''}` : 'Unknown User'),
                    message: chat.lastMessage || "No messages yet",
                    time: chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                    unread: 0,
                    avatar: chat.type === 'group' ? null : (chat.otherUser?.avatar || "use_initials"),
                    status: "offline",
                    type: chat.type || "private",
                    participantId: chat.otherUser?.id,
                }));
                setChats(mappedChats);
            }
        } catch (err) {
            console.error("Failed to load chats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // FETCH CONTACTS
    const fetchContacts = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/users/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const users = await res.json();
                if (Array.isArray(users)) {
                    const mappedContacts = users.map((u: any) => ({
                        ...u,
                        id: u.id,
                        name: u.name ? `${u.name} ${u.surname || ''}`.trim() : (u.phone || u.username || "Unknown Contact"),
                        message: u.bio || "No status",
                        time: "",
                        unread: 0,
                        avatar: u.avatar || u.avatar_url || "use_initials",
                        status: "offline",
                        type: "contact",
                    }));
                    setContacts(mappedContacts);
                }
            }
        } catch (err) {
            console.error("Failed to load contacts:", err);
        }
    }, []);
    // HANDLERS
    const handleAddContact = async (user: any) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ participantId: user.id || user.userId })
            });
            if (res.ok) {
                const newChatData = await res.json();
                await fetchContacts();
                await fetchChats();

                const fullChat = {
                    ...newChatData,
                    id: newChatData._id || newChatData.id,
                    name: `${user.name} ${user.surname || ''}`.trim(),
                    avatar: user.avatar || user.avatar_url,
                    type: 'private'
                };
                setSelectedChat(fullChat);
                setActiveCategory('all');
            }
        } catch (err) { console.error(err); }
        setShowContactModal(false);
    };

    const handleCreateGroup = async (name: string, participantIds: string[]) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ type: 'group', name, participants: participantIds })
            });
            if (res.ok) {
                await fetchChats();
                setActiveCategory('all');
                setShowGroupModal(false);
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateChannel = async (data: any) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ type: 'channel', ...data })
            });
            if (res.ok) {
                await fetchChats();
                setShowCreateChannelModal(false);
            }
        } catch (err) { console.error(err); }
    };

    const handleSupport = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/users`);
            if (res.ok) {
                const users = await res.json();
                const admin = users.find((u: any) => u.phone === '+998950203601' || u.role === 'admin');
                if (admin) handleAddContact(admin);
            }
        } catch (e) { console.error(e); }
        setShowMenu(false);
    };

    const handleDeleteContact = async (contactId: string) => {
        if (!window.confirm("Kontakt va barcha yozishmalarni ikkala tomon uchun ham o'chirmoqchimisiz?")) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/users/contacts/${contactId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchContacts();
                await fetchChats();
                if (selectedChat && (String(selectedChat.participantId) === String(contactId) || String(selectedChat.otherUser?.id) === String(contactId))) {
                    setSelectedChat(null);
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const token = localStorage.getItem('token');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            // Search both contacts (local) and global users (API)
            const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const globalResults = await res.json();
                const mappedResults = globalResults.map((u: any) => ({
                    ...u,
                    id: u.id,
                    name: u.name ? `${u.name} ${u.surname || ''}`.trim() : (u.फोन || u.username || "User"),
                    message: u.bio || `@${u.username}`,
                    avatar: u.avatar || u.avatar_url || "use_initials",
                    type: 'contact', // Handle as contact for selection
                    isGlobal: true
                }));
                setSearchResults(mappedResults);
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    // INITIAL LOAD & SOCKETS
    useEffect(() => {
        const loadInitial = async () => {
            const userJson = localStorage.getItem('user');
            if (userJson) {
                try {
                    const parsed = JSON.parse(userJson);
                    setCurrentUser(parsed);
                } catch (e) {
                    console.error("Failed to parse user from localStorage", e);
                }
            }
            await fetchChats();
            await fetchContacts();
        };

        loadInitial();

        if (socket) {
            const handleProfileUpdate = (data: any) => {
                const myId = JSON.parse(localStorage.getItem('user') || '{}').id;
                if (String(data.userId) === String(myId)) {
                    console.log("[MessagesPage] My profile updated, refreshing state...");
                    const current = JSON.parse(localStorage.getItem('user') || '{}');
                    const updated = { ...current, ...data, avatar: data.avatar_url || data.avatar };
                    localStorage.setItem('user', JSON.stringify(updated));
                    setCurrentUser(updated);
                }
                fetchChats();
                fetchContacts();
            };

            socket.on('profile_updated', handleProfileUpdate);
            return () => { socket.off('profile_updated', handleProfileUpdate); };
        }
    }, [socket, fetchChats, fetchContacts]);

    const isPanelCategory = ['jobs', 'services', 'finance', 'communities', 'wallet', 'profile', 'settings', 'profile_edit'].includes(activeCategory);
    const showDetail = !!selectedChat || isPanelCategory;

    return (
        <div className="h-screen w-full flex items-center justify-center p-0 lg:p-4 overflow-hidden relative">
            {/* Global Dynamic Background Image */}
            <div
                className="absolute inset-0 z-0 transition-all duration-700 ease-in-out"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: `blur(${bgBlur}px) brightness(${isDarkMode ? 0.6 : 0.9})`,
                    transform: 'scale(1.1)' // Prevent blur edges from showing
                }}
            />

            <div className="w-full h-full max-w-[1800px] flex flex-col lg:flex-row gap-2 lg:gap-4 relative z-10 pt-4 lg:pt-8">

                {/* Global Navigation Drawer (Menu) - Premium Glass Style */}
                {showMenu && (
                    <>
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[100] animate-in fade-in duration-300" onClick={() => setShowMenu(false)}></div>
                        <div className="fixed top-0 left-0 bottom-0 w-[300px] z-[110] flex flex-col animate-in slide-in-from-left duration-300 ease-out bg-white/30 backdrop-blur-[25px] brightness-[0.85] border-r border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between p-5 px-6 border-b border-white/10">
                                <h2 className="text-white font-bold text-xl tracking-tight drop-shadow-md">MessenjrAli</h2>
                                <button onClick={() => setShowMenu(false)} className="text-white/80 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                            </div>

                            {/* Drawer User Info */}
                            <div className="px-6 py-8 flex items-center gap-5 border-b border-white/10 group cursor-pointer hover:bg-white/10 transition-all"
                                onClick={() => { setShowMenu(false); setActiveCategory('profile'); }}>
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl relative">
                                    {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xl">{currentUser?.name?.[0]}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold truncate text-lg drop-shadow-sm">{currentUser?.name}</h3>
                                    <p className="text-white/60 text-[13px] font-medium truncate">@{currentUser?.username}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                                <button onClick={() => { setShowMenu(false); setActiveCategory('profile'); }} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <UserCircle className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> My Profile
                                </button>
                                <button onClick={() => { setShowMenu(false); setActiveCategory('wallet'); }} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <Wallet className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> Wallet
                                </button>
                                <button onClick={() => { setShowMenu(false); handleSupport(); }} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <HelpCircle className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> Support
                                </button>
                                <div className="h-[1px] bg-white/10 my-4 mx-6"></div>
                                <button onClick={() => { setShowMenu(false); setShowGroupModal(true); }} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <Users className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> Create Group
                                </button>
                                <button onClick={() => { setShowMenu(false); setShowCreateChannelModal(true); }} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <Megaphone className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> Create Channel
                                </button>
                                <button onClick={() => { setShowMenu(false); setShowContactsModal(true); }} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <Contact className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> Contacts
                                </button>
                                <button className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <Bookmark className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> Saved
                                </button>
                                <button onClick={() => { setShowMenu(false); setActiveCategory('settings'); }} className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/10 text-white font-medium transition-all group">
                                    <Settings className="h-[22px] w-[22px] text-white/50 group-hover:text-blue-400" /> Settings
                                </button>
                            </div>

                            <div className="p-6 border-t border-white/10 space-y-4">
                                <div className="flex items-center justify-between text-white/50 px-2">
                                    <span className="text-xs uppercase font-bold tracking-widest">v 1.2.0</span>
                                    <Moon className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Modals */}
                {showContactModal && <AddContactModal onClose={() => setShowContactModal(false)} onStartChat={handleAddContact} />}
                {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} onCreateGroup={handleCreateGroup} />}
                {showCreateChannelModal && <CreateChannelModal onClose={() => setShowCreateChannelModal(false)} onCreateChannel={handleCreateChannel} />}
                {showContactsModal && (
                    <ContactsModal
                        contacts={contacts}
                        onClose={() => setShowContactsModal(false)}
                        onStartChat={handleAddContact}
                        onAddContact={() => { setShowContactsModal(false); setShowContactModal(true); }}
                        onDeleteContact={handleDeleteContact}
                    />
                )}

                {/* Global Mobile Header - Only visible on mobile */}
                <div className="lg:hidden sticky top-0 z-50 glass-premium shadow-lg !border-t-0 !border-x-0 !rounded-none">
                    <div className="p-4 pb-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setShowMenu(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><MenuIcon className="h-6 w-6" /></button>
                            <h2 className="text-white font-bold text-lg">MessenjrAli</h2>
                            <button onClick={() => setShowContactModal(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><PenSquare className="h-5 w-5" /></button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-white/30" /></div>
                            <input
                                type="text"
                                placeholder="Qidirish"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full bg-white/5 border-none outline-none text-white rounded-full py-2.5 pl-11 pr-4 placeholder-white/30 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => handleSearch("")}
                                    className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto px-4 py-3 no-scrollbar mask-overflow mb-2 flex-nowrap border-b border-white/5">
                        {CATEGORIES.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${activeCategory === cat.id ? 'bg-[#3b82f6] text-white' : 'bg-white/5 text-white/40'}`}>
                                <div className="w-6 h-6">{cat.icon}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Left Panel: ChatList */}
                <aside className={` ${showDetail ? 'hidden lg:block' : 'w-full'} lg:w-80 xl:w-96 h-full flex-shrink-0 `}>
                    <ChatList
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        onChatSelect={(chat) => { setSelectedChat(chat); if (activeCategory !== 'all') setActiveCategory('all'); }}
                        hideHeader={true}
                        hideCategories={true}
                        showMenu={showMenu} setShowMenu={setShowMenu}
                        showContactModal={showContactModal} setShowContactModal={setShowContactModal}
                        showGroupModal={showGroupModal} setShowGroupModal={setShowGroupModal}
                        showCreateChannelModal={showCreateChannelModal} setShowCreateChannelModal={setShowCreateChannelModal}
                        showContactsModal={showContactsModal} setShowContactsModal={setShowContactsModal}
                        currentUser={currentUser}
                        chats={chats}
                        contacts={contacts}
                        loading={loading}
                        handleAddContact={handleAddContact}
                        handleSupport={handleSupport}
                        handleDeleteContact={handleDeleteContact}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearch}
                        searchResults={searchResults}
                        isSearching={isSearching}
                    />
                </aside>

                <main className={` ${!showDetail ? 'hidden lg:block' : 'w-full'} flex-1 h-full min-w-0 relative `}>
                    {activeCategory === 'jobs' ? <div className="w-full h-full p-4 overflow-hidden"><ServicesList activeTab="jobs" onStartChat={handleAddContact} /></div>
                        : activeCategory === 'services' ? <div className="w-full h-full p-4 overflow-hidden"><ServicesList activeTab="experts" onStartChat={handleAddContact} /></div>
                            : activeCategory === 'finance' ? <div className="w-full h-full p-4 overflow-hidden"><ExpenseTracker /></div>
                                : activeCategory === 'communities' ? <div className="w-full h-full p-4 overflow-hidden"><CommunitiesList /></div>
                                    : activeCategory === 'wallet' ? <WalletPanel onChatSelect={(chat) => { setSelectedChat(chat); setActiveCategory('all'); }} />
                                        : (activeCategory === 'profile' || activeCategory === 'settings') ? (
                                            <ProfileViewer
                                                mode={activeCategory as any}
                                                onClose={() => setActiveCategory('all')}
                                                onEdit={() => setActiveCategory('profile_edit')}
                                                onLogout={() => { localStorage.clear(); window.location.href = '/auth'; }}
                                                user={currentUser}
                                                bgSettings={{ blur: bgBlur, image: bgImage, darkMode: isDarkMode }}
                                                onUpdateBgBlur={updateBgBlur}
                                                onUpdateBgImage={updateBgImage}
                                                onUpdateTheme={updateTheme}
                                            />
                                        )
                                            : activeCategory === 'profile_edit' ? <ProfileEditor onClose={() => setActiveCategory('profile')} onSave={() => setActiveCategory('profile')} />
                                                : <ChatWindow chat={selectedChat} onToggleInfo={() => setShowRightPanel(!showRightPanel)} onBack={() => setSelectedChat(null)} />}
                </main>

                {showRightPanel && selectedChat && (
                    <aside className="fixed lg:relative inset-0 lg:inset-auto z-[110] lg:z-0 xl:block w-80 h-full flex-shrink-0 animate-slide-left">
                        {selectedChat.type === 'channel' ? <ChannelInfoPanel chat={selectedChat} onClose={() => setShowRightPanel(false)} />
                            : selectedChat.type === 'private' ? <UserInfoPanel chat={selectedChat} onClose={() => setShowRightPanel(false)} />
                                : <GroupInfoPanel chat={selectedChat} onClose={() => setShowRightPanel(false)} />}
                    </aside>
                )}
            </div>
        </div>
    );
}
