"use client";

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { GlassCard } from '../ui/GlassCard';
import { LiveVideoFrame } from './shared/LiveVideoFrame';
import { LiveChatPanel } from './shared/LiveChatPanel';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useRemoteParticipants
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
    Settings,
    Bell,
    FileText,
    Video,
    Link as LinkIcon,
    PenTool,
    MessageSquare,
    LogOut,
    Menu,
    MoreHorizontal
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface StudentDashboardProps {
    user: any;
    sessionId: string;
    onLeave: () => void;
}

function MentorProfileHeader() {
    const participants = useRemoteParticipants();
    // In our current logic, the first remote participant is usually assumed to be the mentor for students
    const mentor = participants.length > 0 ? participants[0] : null;

    return (
        <div className="flex items-center gap-3 ml-2">
            <span className="text-sm font-medium text-white/80">{mentor?.identity || 'Kutilmoqda (Ustoz)'}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-lg shadow-indigo-500/20">
                {mentor ? (mentor.identity?.[0]?.toUpperCase() || 'U') : '?'}
            </div>
        </div>
    );
}

export default function StudentDashboard({ user, sessionId, onLeave }: StudentDashboardProps) {
    const { socket } = useSocket();
    const [token, setToken] = useState<string>('');
    const [wsUrl, setWsUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Live Data States
    const [materials, setMaterials] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, Record<number, string>>>({}); // { quizId: { questionIndex: optionId } }

    useEffect(() => {
        if (!socket || !sessionId) return;

        socket.emit('join_room', sessionId);

        const handleNewMaterial = (data: any) => {
            if (data.sessionId === sessionId) {
                setMaterials(prev => [...prev, data.material]);
            }
        };

        const handleQuizStart = (data: any) => {
            if (data.sessionId === sessionId) {
                setQuizzes(prev => [...prev, data.quizDetails]);
            }
        };

        socket.on('material_uploaded', handleNewMaterial);
        socket.on('quiz_start', handleQuizStart);

        return () => {
            socket.off('material_uploaded', handleNewMaterial);
            socket.off('quiz_start', handleQuizStart);
        };
    }, [socket, sessionId]);

    const handleSelectAnswer = (quizId: number, questionIndex: number, optionId: string) => {
        setQuizAnswers(prev => ({
            ...prev,
            [quizId]: {
                ...(prev[quizId] || {}),
                [questionIndex]: optionId
            }
        }));
    };

    const handleSubmitQuiz = (quizId: number) => {
        const answers = quizAnswers[quizId];
        if (!answers) return alert("Please answer the questions first.");

        if (socket) {
            socket.emit('quiz_submit', {
                sessionId,
                quizId,
                studentId: user?.id,
                answers
            });
        }
        alert("Viktorina javoblari yuborildi!");
        // Optional: Remove quiz from screen after submit
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
    };

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await apiFetch(`/api/livekit/token?room=${sessionId}&username=${encodeURIComponent(user?.name || 'Talaba')}`);
                if (res.ok) {
                    const data = await res.json();
                    setToken(data.token);
                    setWsUrl(data.wsUrl);
                } else {
                    console.error("Token fetch failed with status:", res.status);
                }
            } catch (err) {
                console.error("Token xatosi:", err);
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) fetchToken();
    }, [sessionId, user]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0f1117]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0f1117] text-white">
                <p className="text-xl mb-4 font-medium">Ulanish tokeni olinmadi.</p>
                <button onClick={onLeave} className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-all">Orqaga Qaytish</button>
            </div>
        );
    }

    const avatarUrl = user?.avatar_url || user?.avatar;
    const finalAvatar = avatarUrl
        ? (avatarUrl.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`)
        : "https://i.pravatar.cc/150?img=5";

    return (
        <div className="fixed inset-0 flex flex-col bg-[#11131a] text-white overflow-hidden font-sans">
            <LiveKitRoom
                video={true}
                audio={true}
                connect={true}
                token={token}
                serverUrl={wsUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://mali-livekit-tl6r65ar.livekit.cloud'}
                data-lk-theme="default"
                className="flex flex-col flex-1 w-full h-full relative"
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-6 bg-[#161821] border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={finalAvatar}
                                alt="avatar"
                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                            />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#161821]"></div>
                        </div>
                        <h1 className="text-lg font-medium tracking-wide"><span className="font-bold">{user?.name || 'Talaba'}</span> Paneli</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-white/60 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-[#161821]"></span>
                        </button>
                        <button className="p-2 text-white/60 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                        {/* Mentor Profile Avatar */}
                        <MentorProfileHeader />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex overflow-hidden p-4 gap-4">

                    {/* LEFT SIDEBAR: Materials & Live Test */}
                    <div className="w-[300px] flex-shrink-0 flex flex-col gap-4">
                        {/* Materials Card */}
                        <GlassCard className="flex-1 !bg-[#1c1f2b] !rounded-xl !border-transparent flex flex-col overflow-hidden max-h-[50%]">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h2 className="font-bold text-[15px]">Materials</h2>
                                <MoreHorizontal className="w-5 h-5 text-white/40 cursor-pointer hover:text-white transition-colors" />
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                <h3 className="text-xs text-white/50 font-bold uppercase mb-1">Course Materials</h3>
                                {materials.length === 0 && (
                                    <div className="text-white/40 text-sm text-center py-4">Hozircha materiallar yo'q</div>
                                )}
                                {materials.map((mat, idx) => (
                                    <a key={mat.id || idx} href={mat.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5">
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${mat.type === 'pdf' ? 'bg-white/10 text-white' : mat.type === 'video' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white'}`}>
                                            {mat.type === 'pdf' ? <FileText className="w-4 h-4" /> : mat.type === 'video' ? <Video className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                        </div>
                                        <span className="text-sm font-medium text-white/90 truncate">{mat.title}</span>
                                    </a>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Live Test Card Overview */}
                        <GlassCard className="flex-1 !bg-[#1c1f2b] !rounded-xl !border-transparent flex flex-col overflow-hidden max-h-[50%]">
                            <div className="p-4 border-b border-white/5">
                                <h2 className="font-bold text-[15px]">Jonli Sinov</h2>
                            </div>
                            <div className="p-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                                {quizzes.length === 0 ? (
                                    <div className="text-white/40 text-sm text-center py-4">Faol viktorina yo'q</div>
                                ) : quizzes.map(quiz => (
                                    <div key={quiz.id} className="border border-white/10 bg-white/[0.02] rounded-xl p-4 mb-3">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                                                    <PenTool className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm">{quiz.title}</h3>
                                                    <p className="text-[11px] text-white/50">{quiz.questions?.length} ta savol</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-400 mb-2 font-medium">Viktorina boshlandi. O'ng panelda javob bering.</p>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* CENTER: LiveKit Video Area */}
                    <div className="flex-1 min-w-0 bg-[#000000] rounded-xl overflow-hidden relative flex flex-col border border-white/5 shadow-2xl">
                        <LiveVideoFrame isMentor={false} />
                        <RoomAudioRenderer />
                    </div>

                    {/* RIGHT SIDEBAR: Quizzes & Chat */}
                    <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
                        {/* Active Quizzes */}
                        <GlassCard className="flex-1 !bg-[#1c1f2b] !rounded-xl !border-transparent flex flex-col overflow-hidden max-h-[60%]">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h2 className="font-bold text-[15px]">Quizzes</h2>
                                <MoreHorizontal className="w-5 h-5 text-white/40 cursor-pointer hover:text-white" />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">
                                {quizzes.length === 0 ? (
                                    <div className="text-white/40 text-sm py-4">Ustoz viktorina yuborishi kutilmoqda...</div>
                                ) : quizzes.map(quiz => (
                                    <div key={quiz.id} className="animate-fade-in">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black">?</div>
                                            <div>
                                                <h3 className="font-bold text-[15px]">{quiz.title}</h3>
                                                <p className="text-[11px] text-white/50"><span className="text-white font-bold">{quiz.questions?.length} ta Savol</span></p>
                                            </div>
                                        </div>

                                        {quiz.questions?.map((q: any, i: number) => {
                                            const selectedOption = quizAnswers[quiz.id]?.[i];
                                            return (
                                                <div key={i} className="mb-5 last:mb-0">
                                                    <p className="text-sm font-medium mb-3 flex gap-2">
                                                        <span className="font-bold">{i + 1}.</span>
                                                        <span className="text-white/90 leading-relaxed">{q.text}</span>
                                                    </p>
                                                    <div className="flex flex-col gap-2 pl-4">
                                                        {q.options?.map((opt: any) => (
                                                            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                                                                <input
                                                                    type="radio"
                                                                    name={`q_${quiz.id}_${i}`}
                                                                    checked={selectedOption === opt.id}
                                                                    onChange={() => handleSelectAnswer(quiz.id, i, opt.id)}
                                                                    className="hidden"
                                                                />
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedOption === opt.id ? 'border-blue-500' : 'border-white/30 group-hover:border-white/60'}`}>
                                                                    {selectedOption === opt.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm">
                                                                    <span className="font-bold text-white/70 w-4">{opt.id}</span>
                                                                    <span className={selectedOption === opt.id ? 'text-white font-medium' : 'text-white/70'}>{opt.label || opt.text}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <button onClick={() => handleSubmitQuiz(quiz.id)} className="w-full mt-4 py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/25 transition-all">
                                            Javoblarni yuborish
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Chat Box (Shared Component) */}
                        <LiveChatPanel socket={socket} sessionId={sessionId} user={user} className="max-h-[40%]" />
                    </div>

                </main>

                {/* Bottom Global Footer (matches image Leave button positioning) */}
                <footer className="h-[60px] flex-shrink-0 bg-[#161821] border-t border-white/5 flex items-center justify-end px-6 mt-auto self-end w-full">
                    <button
                        onClick={onLeave}
                        className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm shadow-lg tracking-wide transition-colors"
                    >
                        Leave
                    </button>
                </footer>

            </LiveKitRoom>
        </div>
    );
}
