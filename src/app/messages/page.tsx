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
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopover from "@/components/chat/NotificationPopover";
import SpecialistDashboard from "@/components/dashboard/SpecialistDashboard";
import {
    Menu as MenuIcon,
    PenSquare,
    Search,
    X,
    UserCircle,
    Wallet,
    HelpCircle,
    Bell,
    Users,
    Megaphone,
    Contact,
    PhoneCall,
    Bookmark,
    Settings,
    Moon,
    LogOut,
    MessageSquare,
    User
} from "lucide-react";
import { apiFetch } from "@/lib/api";


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
    const [isExpertMode, setIsExpertMode] = useState(false);

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
    const [showNotifications, setShowNotifications] = useState(false);
    const { unreadCount } = useNotifications();

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
        console.log("[MessagesPage] fetchChats starting...");
        try {
            const res = await apiFetch(`/api/chats`);
            console.log("[MessagesPage] fetchChats status:", res.status);
            if (res.ok) {
                const data = await res.json();
                console.log("[MessagesPage] fetchChats count:", data.length);
                const mappedChats = data.map((chat: any) => {
                    const chatId = chat.id || chat._id;
                    return {
                        ...chat,
                        id: chatId,
                        name: chat.type === 'group' ? chat.name : (chat.otherUser?.name ? `${chat.otherUser.name} ${chat.otherUser.surname || ''}` : 'Unknown User'),
                        message: chat.lastMessage || "No messages yet",
                        time: chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                        unread: (String(chatId) === String(selectedChat?.id)) ? 0 : (chat.unread || 0),
                        avatar: chat.type === 'group' ? null : (chat.otherUser?.avatar || "use_initials"),
                        status: "offline",
                        type: chat.type || "private",
                        participantId: chat.otherUser?.id,
                    };
                });
                setChats(mappedChats);
            }
        } catch (err) {
            console.error("Failed to load chats:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedChat?.id]);

    // FETCH CONTACTS
    const fetchContacts = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        console.log("[MessagesPage] fetchContacts starting...");
        try {
            const res = await apiFetch(`/api/users/contacts`);
            console.log("[MessagesPage] fetchContacts status:", res.status);
            if (res.ok) {
                const users = await res.json();
                console.log("[MessagesPage] fetchContacts count:", users.length);
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
            const res = await apiFetch(`/api/chats`, {
                method: 'POST',
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
            const res = await apiFetch(`/api/chats`, {
                method: 'POST',
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
            const res = await apiFetch(`/api/chats`, {
                method: 'POST',
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
            const res = await apiFetch(`/api/users`);
            if (res.ok) {
                const users = await res.json();
                const admin = users.find((u: any) => u.phone === '+998950203601' || u.role === 'admin');
                if (admin) handleAddContact(admin);
            }
        } catch (e) { console.error(e); }
        setShowMenu(false);
    };

    const handleMarkAsRead = useCallback(async (chatId: string) => {
        try {
            await apiFetch(`/api/chats/${chatId}/read`, { method: 'POST' });
            // Update local state immediately
            setChats(prev => prev.map(c =>
                String(c.id) === String(chatId) ? { ...c, unread: 0 } : c
            ));
        } catch (err) {
            console.error("Failed to mark chat as read:", err);
        }
    }, []);

    const handleDeleteContact = async (contactId: string) => {
        if (!window.confirm("Kontakt va barcha yozishmalarni ikkala tomon uchun ham o'chirmoqchimisiz?")) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await apiFetch(`/api/users/contacts/${contactId}`, {
                method: 'DELETE'
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
            const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
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

            const handleReceiveMessage = (message: any) => {
                setChats(prev => {
                    const chatId = message.chat_id || message.roomId;
                    const index = prev.findIndex(c => String(c.id) === String(chatId));
                    if (index === -1) {
                        fetchChats();
                        return prev;
                    }
                    const updatedChats = [...prev];
                    const chat = { ...updatedChats[index] };
                    chat.message = message.content;
                    chat.time = new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    const myId = JSON.parse(localStorage.getItem('user') || '{}').id;
                    const senderId = message.sender_id || message.senderId;

                    // Reset unread if this IS the current chat
                    if (String(chatId) === String(selectedChat?.id)) {
                        chat.unread = 0;
                    } else if (String(senderId) !== String(myId)) {
                        chat.unread = (chat.unread || 0) + 1;
                    }

                    updatedChats.splice(index, 1);
                    updatedChats.unshift(chat);
                    return updatedChats;
                });
            };

            socket.on('profile_updated', handleProfileUpdate);
            socket.on('receive_message', handleReceiveMessage);
            return () => {
                socket.off('profile_updated', handleProfileUpdate);
                socket.off('receive_message', handleReceiveMessage);
            };
        }
    }, [socket, fetchChats, fetchContacts, selectedChat?.id]);

    // Reset unread count locally when a chat is selected
    useEffect(() => {
        if (selectedChat?.id) {
            setChats(prev => prev.map(c =>
                String(c.id) === String(selectedChat.id) ? { ...c, unread: 0 } : c
            ));
        }
    }, [selectedChat?.id]);

    const isPanelCategory = ['jobs', 'services', 'finance', 'communities', 'wallet', 'profile', 'settings', 'profile_edit'].includes(activeCategory);
    const showDetail = !!selectedChat || isPanelCategory;

    return (
        <div className="h-screen w-full flex items-center justify-center p-0 lg:p-4 overflow-hidden relative overflow-x-hidden">
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

                {showNotifications && (
                    <NotificationPopover onClose={() => setShowNotifications(false)} />
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

                {/* Global Mobile Header - Only visible on mobile, hidden when chat is open */}
                {!showDetail && (
                    <div className="lg:hidden sticky top-0 z-50 glass-premium shadow-lg !border-t-0 !border-x-0 !rounded-none pt-[max(2.5rem,env(safe-area-inset-top))]">
                        <div className="p-4 pb-1 pt-0 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <button onClick={() => setShowMenu(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><MenuIcon className="h-6 w-6" /></button>
                                <h2 className="text-white font-bold text-lg">MessenjrAli</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className={`w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-300 relative group ${showNotifications ? 'ring-2 ring-blue-500/50 bg-white/20' : ''}`}
                                    >
                                        <Bell className={`h-5 w-5 transition-transform duration-300 ${unreadCount > 0 ? 'group-hover:rotate-12' : ''}`} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full text-[10px] flex items-center justify-center font-black shadow-lg border-2 border-white/20 pulse-notification">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    <button onClick={() => setShowContactModal(true)} className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-300"><PenSquare className="h-5 w-5" /></button>
                                </div>
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
                        <div className="flex gap-4 overflow-x-auto px-4 py-3 no-scrollbar mask-overflow mb-2 flex-nowrap border-b border-white/5 lg:flex">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${activeCategory === cat.id ? 'bg-[#3b82f6] text-white' : 'bg-white/5 text-white/40'}`}>
                                    <div className="w-6 h-6">{cat.icon}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Left Panel: ChatList */}
                <aside className={` ${showDetail ? 'hidden lg:block' : (isExpertMode ? 'flex-none' : 'flex-1')} ${isExpertMode ? 'lg:w-0 lg:p-0 w-0 p-0 opacity-0 pointer-events-none absolute lg:relative z-0' : 'lg:w-[380px] lg:p-3 w-full p-2 opacity-100 relative z-10'} transition-all duration-500 ease-in-out lg:h-full flex-shrink-0 flex flex-col overflow-hidden `}>
                    <ChatList
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        onChatSelect={(chat) => {
                            setSelectedChat(chat);
                            if (activeCategory !== 'all') setActiveCategory('all');
                            if (window.innerWidth < 1024) setShowRightPanel(false);
                            setIsExpertMode(false); // Turn off expert mode when a chat is selected
                        }}
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
                        isExpertMode={isExpertMode}
                        onToggleExpertMode={() => {
                            setIsExpertMode(!isExpertMode);
                            setSelectedChat(null); // Clear selected chat when switching to expert mode
                        }}
                    />
                </aside>

                <main className={` ${!showDetail ? 'hidden lg:block' : 'w-full'} flex-1 h-full min-w-0 relative `}>
                    {activeCategory === 'jobs' ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <header className="lg:hidden p-4 border-b border-white/5 flex items-center gap-3 bg-[#1a1c20]/80 backdrop-blur-xl pt-[max(2rem,env(safe-area-inset-top))]">
                                <button onClick={() => setActiveCategory('all')} className="p-2 -ml-2 hover:bg-white/10 rounded-full text-white/70 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h2 className="text-white font-bold">Ish qidirish</h2>
                            </header>
                            <div className="w-full h-full p-4 overflow-hidden">
                                <ServicesList activeTab="jobs" onStartChat={handleAddContact} />
                            </div>
                        </div>
                    )
                        : activeCategory === 'services' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <header className="lg:hidden p-4 border-b border-white/5 flex items-center gap-3 bg-[#1a1c20]/80 backdrop-blur-xl pt-[max(2rem,env(safe-area-inset-top))]">
                                    <button onClick={() => setActiveCategory('all')} className="p-2 -ml-2 hover:bg-white/10 rounded-full text-white/70 shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <h2 className="text-white font-bold">Xizmatlar</h2>
                                </header>
                                <div className="w-full h-full p-4 overflow-hidden">
                                    <ServicesList activeTab="experts" onStartChat={handleAddContact} />
                                </div>
                            </div>
                        )
                            : activeCategory === 'finance' ? (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <header className="lg:hidden p-4 border-b border-white/5 flex items-center gap-3 bg-[#1a1c20]/80 backdrop-blur-xl pt-[max(2rem,env(safe-area-inset-top))]">
                                        <button onClick={() => setActiveCategory('all')} className="p-2 -ml-2 hover:bg-white/10 rounded-full text-white/70 shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <h2 className="text-white font-bold">Moliya</h2>
                                    </header>
                                    <div className="w-full h-full p-4 overflow-hidden">
                                        <ExpenseTracker />
                                    </div>
                                </div>
                            )
                                : activeCategory === 'communities' ? (
                                    <div className="flex flex-col h-full overflow-hidden">
                                        <header className="lg:hidden p-4 border-b border-white/5 flex items-center gap-3 bg-[#1a1c20]/80 backdrop-blur-xl pt-[max(2rem,env(safe-area-inset-top))]">
                                            <button onClick={() => setActiveCategory('all')} className="p-2 -ml-2 hover:bg-white/10 rounded-full text-white/70 shadow-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            <h2 className="text-white font-bold">Hamjamiyatlar</h2>
                                        </header>
                                        <div className="w-full h-full p-4 overflow-hidden">
                                            <CommunitiesList />
                                        </div>
                                    </div>
                                )
                                    : activeCategory === 'wallet' ? (
                                        <div className="flex flex-col h-full overflow-hidden">
                                            <header className="lg:hidden p-4 border-b border-white/5 flex items-center gap-3 bg-[#1a1c20]/80 backdrop-blur-xl pt-[max(2rem,env(safe-area-inset-top))]">
                                                <button onClick={() => setActiveCategory('all')} className="p-2 -ml-2 hover:bg-white/10 rounded-full text-white/70 shadow-lg">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                                <h2 className="text-white font-bold">Hamyon</h2>
                                            </header>
                                            <WalletPanel onChatSelect={(chat) => { setSelectedChat(chat); setActiveCategory('all'); }} />
                                        </div>
                                    )
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
                                                : isExpertMode && currentUser?.is_expert ? (
                                                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                                                        <SpecialistDashboard
                                                            user={currentUser}
                                                            sessionId={selectedChat?.id || 'demo-session-id'}
                                                            socket={socket}
                                                            onBack={() => setIsExpertMode(false)}
                                                        />
                                                    </div>
                                                ) : (selectedChat ? (
                                                    <ChatWindow
                                                        chat={selectedChat}
                                                        onToggleInfo={() => setShowRightPanel(!showRightPanel)}
                                                        onBack={() => setSelectedChat(null)}
                                                        onMarkAsRead={handleMarkAsRead}
                                                    />
                                                )
                                                    : (
                                                        <div className="hidden lg:flex flex-1 h-full items-center justify-center text-white/20 flex-col gap-4 bg-black/10 backdrop-blur-sm">
                                                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                                                <MessageSquare className="h-10 w-10 opacity-20" />
                                                            </div>
                                                            <p className="text-sm font-medium">Suhbatni boshlash uchun kontakt tanlang</p>
                                                        </div>
                                                    ))}
                </main>

                {/* Mobile Bottom Navigation - V3 Pro Style, hidden when chat is open */}
                {!showDetail && (
                    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-[72px] glass-premium border-t border-white/10 flex items-center justify-around px-2 z-[50]">
                        {[
                            { id: 'all', label: 'Chatlar', icon: <MessageSquare className="h-6 w-6" /> },
                            { id: 'wallet', label: 'Hamyon', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
                            { id: 'services', label: 'Xizmatlar', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                            { id: 'settings', label: 'Profil', icon: <User className="h-6 w-6" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveCategory(tab.id); setSelectedChat(null); }}
                                className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all duration-300 ${activeCategory === tab.id && !selectedChat ? 'text-blue-500 scale-110' : 'text-white/40'}`}
                            >
                                {tab.icon}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                )}

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
