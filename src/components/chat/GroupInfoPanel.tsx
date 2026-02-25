import React, { useEffect, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import AddContactModal from './AddContactModal';
import { X } from 'lucide-react';

interface GroupInfoPanelProps {
    chat: any;
    onClose?: () => void;
}

export default function GroupInfoPanel({ chat, onClose }: GroupInfoPanelProps) {
    const [fullChatDetails, setFullChatDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
    }, []);

    const fetchGroupDetails = async () => {
        if (!chat || chat.type !== 'group') return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/chats/${chat.id || chat._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFullChatDetails(data);
            }
        } catch (err) {
            console.error("Failed to fetch group details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (chat) {
            setFullChatDetails(null); // Reset while loading
            if (chat.type === 'group') {
                fetchGroupDetails();
            }
        }
    }, [chat]);

    const handleAddMember = async (user: any) => {
        if (!chat) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/chats/${chat.id || chat._id}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                // Refresh details
                fetchGroupDetails();
                setShowAddMemberModal(false);
            } else {
                const err = await res.json();
                console.error("Failed to add member:", err.message);
                alert(err.message); // Simple feedback for now
            }
        } catch (err) {
            console.error("Failed to add member:", err);
        }
    };

    if (!chat) {
        return (
            <div className="h-full flex items-center justify-center text-white/30 text-sm">
                Select a chat to view info
            </div>
        );
    }

    if (chat.type !== 'group') {
        const otherUser = chat.otherUser || {};
        return (
            <div className="h-full overflow-y-auto custom-scrollbar flex flex-col gap-4 p-4">
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-lg">
                        {otherUser.avatar ? (
                            <img src={otherUser.avatar} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            (chat.name || '?').charAt(0).toUpperCase()
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{chat.name}</h2>
                    <p className="text-[var(--text-secondary)] text-sm">{otherUser.phone || 'No phone'}</p>
                </div>
                {/* Shared Media Placeholders (Future) */}
                <div className="text-center text-white/30 text-sm mt-10">
                    Shared media coming soon
                </div>
            </div>
        );
    }

    const participants = fullChatDetails?.participants || [];

    return (
        <div className="lg:h-full lg:static fixed inset-0 z-[100] bg-[#788296]/25 backdrop-blur-xl lg:bg-transparent flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {/* Close Button Trigger for consistency */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
                <X className="h-5 w-5" />
            </button>
            {/* Group Header */}
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-lg shadow-purple-900/30">
                    {/* Group Avatar Placeholder */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{chat.name}</h2>
                <p className="text-[var(--text-secondary)] text-sm">
                    {loading ? 'Loading...' : `${participants.length} members`}
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 px-4">
                <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white flex flex-col items-center gap-2 transition-colors"
                >
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <span className="text-xs">Add Member</span>
                </button>
                <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white flex flex-col items-center gap-2 transition-colors">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </div>
                    <span className="text-xs">Mute</span>
                </button>
            </div>


            {/* Members List */}
            <div className="px-3 flex-1">
                <div className="flex justify-between items-center mb-2 px-1 sticky top-0 bg-[#788296]/10 backdrop-blur-md py-2 z-10 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Members</h3>
                </div>
                <div className="space-y-2 pb-4">
                    {participants.map((member: any) => (
                        <GlassCard key={member.id} className="!p-2 flex items-center gap-3 bg-transparent border-transparent shadow-none hover:bg-white/5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-sm text-white font-bold flex-shrink-0">
                                {member.avatar ? (
                                    <img src={member.avatar} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    (member.name || '?').charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm text-white font-medium truncate">
                                    {member.name} {member.surname}
                                    {member.id === currentUser?.id && <span className="ml-2 text-xs text-white/40">(You)</span>}
                                </h4>
                                <p className="text-xs text-[var(--text-tertiary)] truncate">{member.phone}</p>
                            </div>
                            {/* <span className="text-xs text-green-400">Online</span> */}
                        </GlassCard>
                    ))}

                    {participants.length === 0 && !loading && (
                        <p className="text-center text-white/30 text-sm py-4">No members info</p>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddMemberModal && (
                <AddContactModal
                    onClose={() => setShowAddMemberModal(false)}
                    onStartChat={handleAddMember} // Reusing this prop as 'onSelectUser'
                />
            )}
        </div>
    );
}
