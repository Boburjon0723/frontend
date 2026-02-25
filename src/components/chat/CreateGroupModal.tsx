import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreateGroup: (name: string, participantIds: string[]) => void;
}

export default function CreateGroupModal({ onClose, onCreateGroup }: CreateGroupModalProps) {
    const [step, setStep] = useState<1 | 2>(1); // 1: Select Users, 2: Group Info
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
                const res = await fetch(`${API_URL}/api/users`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter out current user is handled by backend usually, but good to filter here too if we knew current user ID
                    // For now, just show all.
                    setUsers(data);
                }
            } catch (err) {
                console.error("Failed to load users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const toggleUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        setCreating(true);
        await onCreateGroup(groupName, selectedUsers);
        setCreating(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <GlassCard className="w-full max-w-md !p-0 animate-scale-up !bg-black/20 !backdrop-blur-3xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden !rounded-[28px] shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md">
                    <h2 className="text-[19px] font-bold text-white">
                        {step === 1 ? "Ishtirokchilarni tanlang" : "Guruh yaratish"}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-center py-10 text-white/50">Yuklanmoqda...</div>
                            ) : (
                                users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedUsers.includes(user.id) ? 'bg-[var(--accent-purple-start)]/20 border-[var(--accent-purple-start)]' : 'hover:bg-white/5 border-transparent'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUsers.includes(user.id) ? 'border-[var(--accent-purple-start)] bg-[var(--accent-purple-start)]' : 'border-white/30'}`}>
                                            {selectedUsers.includes(user.id) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            )}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" /> : (user.name || '?').substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{user.name} {user.surname}</h3>
                                            <p className="text-white/40 text-xs">{user.phone}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 pt-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <p className="text-white/40 text-sm">Guruh rasmini yuklash (ixtiyoriy)</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/70">Guruh nomi</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Masalan: Do'stlar"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-purple-start)]"
                                    autoFocus
                                />
                            </div>

                            <div className="text-white/50 text-sm">
                                {selectedUsers.length} ta ishtirokchi tanlandi
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            disabled={selectedUsers.length === 0}
                            className="px-6 py-2 bg-[var(--accent-purple-start)] text-white rounded-lg disabled:opacity-50 hover:bg-[var(--accent-purple-end)] transition-colors"
                        >
                            Keyingi
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-2 text-white/70 hover:text-white transition-colors"
                            >
                                Orqaga
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!groupName.trim() || creating}
                                className="px-6 py-2 bg-[var(--accent-purple-start)] text-white rounded-lg disabled:opacity-50 hover:bg-[var(--accent-purple-end)] transition-colors flex items-center gap-2"
                            >
                                {creating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                Yaratish
                            </button>
                        </>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
