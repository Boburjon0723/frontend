"use client";

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { GlassCard } from '../ui/GlassCard';
import { LiveVideoFrame } from './shared/LiveVideoFrame';
import { LiveChatPanel } from './shared/LiveChatPanel';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useRemoteParticipants,
    useLocalParticipant
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
    FileText,
    Video,
    VideoOff,
    Mic,
    MicOff,
    Link as LinkIcon,
    PenTool,
    MessageSquare,
    LogOut,
    X
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface StudentDashboardProps {
    user: { name?: string; id?: string; avatar_url?: string; avatar?: string } | null;
    sessionId: string;
    onLeave: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';
const getAvatarUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

function MentorProfileHeader() {
    const participants = useRemoteParticipants();
    const mentor = participants.length > 0 ? participants[0] : null;

    // Attempt to get avatar from metadata
    let mentorAvatar: string | null = null;
    if (mentor?.metadata) {
        try {
            const meta = JSON.parse(mentor.metadata);
            mentorAvatar = meta.avatar_url || meta.avatar;
        } catch (_e) {
            // Not JSON or missing avatar
        }
    }

    return (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Mentor</span>
                <span className="text-xs font-bold text-white whitespace-nowrap">{mentor?.identity || 'Kutilmoqda...'}</span>
            </div>
            <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-xs border border-white/20 shadow-xl shadow-indigo-500/20 overflow-hidden">
                    {mentorAvatar ? (
                        <img src={getAvatarUrl(mentorAvatar)!} alt="Mentor" className="w-full h-full object-cover" />
                    ) : (
                        mentor ? (mentor.identity?.[0]?.toUpperCase() || 'U') : '?'
                    )}
                </div>
                {mentor && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#11131a]"></div>}
            </div>
        </div>
    );
}

export default function StudentDashboard({ user, sessionId, onLeave }: StudentDashboardProps) {
    // ... existing state ...
    const { socket } = useSocket();
    const [token, setToken] = useState<string>('');
    const [wsUrl, setWsUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [materials, setMaterials] = useState<Array<{ id?: string; url: string; title: string; type?: string }>>([]);
    const [quizzes, setQuizzes] = useState<Array<{ id: number; title: string; questions?: Array<{ text: string; options?: Array<{ id: string; label?: string; text?: string }> }> }>>([]);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, Record<number, string>>>({});
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [activePoll, setActivePoll] = useState<{ id: string; questions?: Array<{ text: string; options?: Array<{ id: string; text: string }> }> } | null>(null);

    const [showChat, setShowChat] = useState(false);
    const [showMaterials, setShowMaterials] = useState(false);
    const [showQuizzes, setShowQuizzes] = useState(false);

    useEffect(() => {
        if (!socket || !sessionId) return;
        socket.emit('session_join', { sessionId });

        const handleNewMaterial = (data: { sessionId: string, material: { id?: string, url: string, title: string, type?: string } }) => {
            if (data.sessionId === sessionId) {
                setMaterials(prev => [...prev, data.material]);
            }
        };

        const handleQuizStart = (data: { sessionId: string, quizDetails: { id: number, title: string, isQuickPoll?: boolean, questions?: any[] } }) => {
            if (data.sessionId === sessionId) {
                if (data.quizDetails?.isQuickPoll) {
                    setActivePoll(data.quizDetails as any);
                } else {
                    setQuizzes(prev => [...prev, data.quizDetails as any]);
                }
            }
        };

        const handleWhiteboardToggle = (data: boolean | { isOpen: boolean, sessionId?: string }) => {
            // Handle both object and boolean formats
            const isOpen = typeof data === 'boolean' ? data : data?.isOpen;
            if (typeof data === 'object' && data?.sessionId && data.sessionId !== sessionId) {
                return; // Ignore other sessions
            }
            setIsWhiteboardOpen(isOpen);
            console.log(`[StudentDashboard] Whiteboard toggled: ${isOpen}`);
        };

        const handleStudentKicked = (data: { sessionId: string }) => {
            if (data.sessionId === sessionId) {
                alert("Siz mentor tomonidan darsdan chiqarildingiz.");
                onLeave();
            }
        };

        socket.on('material_uploaded', handleNewMaterial);
        socket.on('quiz_start', handleQuizStart);
        socket.on('whiteboard:toggle', handleWhiteboardToggle);
        socket.on('student_kicked', handleStudentKicked);

        return () => {
            socket.off('material_uploaded', handleNewMaterial);
            socket.off('quiz_start', handleQuizStart);
            socket.off('whiteboard:toggle', handleWhiteboardToggle);
            socket.off('student_kicked', handleStudentKicked);
        };
    }, [socket, sessionId, onLeave]);

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
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
    };

    const handleAnswerPoll = (quizId: string, questionIndex: number, optionId: string) => {
        if (socket) {
            socket.emit('quiz_answer', {
                sessionId,
                quizId,
                studentId: user?.id,
                answers: { [questionIndex]: optionId }
            });
        }
        setActivePoll(null);
    };

    useEffect(() => {
        const fetchToken = async () => {
            if (!sessionId || sessionId === 'demo-session-id') {
                setError("Sessiya topilmadi yoki tugagan. Mentor yuborgan havolani qayta tekshiring.");
                setLoading(false);
                return;
            }
            try {
                const res = await apiFetch(`/api/livekit/token?room=${sessionId}&username=${encodeURIComponent(user?.name || 'Talaba')}`);
                if (res.ok) {
                    const data = await res.json();
                    setToken(data.token);
                    setWsUrl(data.wsUrl);
                } else {
                    setError("Video xonasiga ulanishda xatolik. Keyinroq qayta urinib ko'ring.");
                }
            } catch (err) {
                console.error(err);
                setError("Tarmoqda xatolik yuz berdi. Internet aloqangizni tekshiring.");
            } finally {
                setLoading(false);
            }
        };
        if (sessionId) fetchToken();
    }, [sessionId, user]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0f1117]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-200">Sessiya ma&apos;lumotlari yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0f1117] text-white px-4 text-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg mb-2 font-semibold">Sessiyaga ulanib bo&apos;lmadi</p>
                <p className="text-sm mb-6 text-slate-300 max-w-md">{error}</p>
                <button
                    onClick={onLeave}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                >
                    Orqaga qaytish
                </button>
            </div>
        );
    }

    if (!token || !wsUrl) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0f1117] text-white">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl mb-4 font-medium">Video xonasiga ulanmoqda...</p>
                <button onClick={onLeave} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all">Bekor Qilish</button>
            </div>
        );
    }

    const finalAvatar = getAvatarUrl((user?.avatar_url || user?.avatar)!) || "https://i.pravatar.cc/150?img=5";

    return (
        <div className="fixed inset-0 flex flex-col bg-[#0a0b10] text-white overflow-hidden font-sans">
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
                <div className="absolute inset-0 z-0 bg-black overflow-hidden">
                    <LiveVideoFrame
                        isMentor={false}
                        immersive={true}
                        isWhiteboardOpen={isWhiteboardOpen}
                        socket={socket}
                        sessionId={sessionId}
                    />
                    <RoomAudioRenderer />
                </div>

                <header className="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-8 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none">
                    <div className="flex items-center gap-5 pointer-events-auto">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
                            <img
                                src={finalAvatar}
                                alt="Studentning profil rasmi"
                                className="relative w-11 h-11 rounded-full object-cover border-2 border-white/50 shadow-2xl transition-transform group-hover:scale-105"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#11131a] shadow-lg"></div>
                        </div>
                        <div>
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">Talaba</p>
                            <h1 className="text-sm font-bold text-white drop-shadow-md tracking-wide">
                                {user?.name || 'Talaba'} Dashboard
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 pointer-events-auto">
                        <MentorProfileHeader />
                        <button onClick={onLeave} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black text-[10px] tracking-widest transition-all flex items-center gap-2.5 group shadow-2xl backdrop-blur-md">
                            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                            CHIQISH
                        </button>
                    </div>
                </header>

                {/* 3. SIDE OVERLAYS: Collapsible Panels */}
                <div className="absolute inset-0 pointer-events-none z-30">
                    {/* Left Panel: Materials */}
                    {showMaterials && (
                        <div className="absolute top-[80px] left-6 bottom-[100px] w-80 pointer-events-auto animate-in slide-in-from-left duration-300">
                            <GlassCard className="h-full !bg-black/60 backdrop-blur-2xl !border-white/10 !rounded-3xl flex flex-col shadow-2xl overflow-hidden">
                                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                                    <h2 className="font-bold text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        Materiallar
                                    </h2>
                                    <button onClick={() => setShowMaterials(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 opacity-50" />
                                    </button>
                                </div>
                                <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                                    {materials.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                                            <FileText className="w-12 h-12" />
                                            <p className="text-sm font-medium">Hozircha materiallar yo'q</p>
                                        </div>
                                    ) : (
                                        materials.map((mat, idx) => (
                                            <a key={mat.id || idx} href={mat.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                                                    {mat.type === 'pdf' ? <FileText className="w-5 h-5" /> : mat.type === 'video' ? <Video className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white/90 truncate">{mat.title}</p>
                                                    <p className="text-[10px] text-white/40 uppercase font-black">{mat.type || 'Fayl'}</p>
                                                </div>
                                            </a>
                                        ))
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* Right Panel: Chat & Quizzes */}
                    {(showChat || showQuizzes) && (
                        <div className="absolute top-[80px] right-6 bottom-[100px] w-80 pointer-events-auto animate-in slide-in-from-right duration-300">
                            <div className="h-full flex flex-col gap-4">
                                {showQuizzes && (
                                    <GlassCard className="flex-1 !bg-black/60 backdrop-blur-2xl !border-white/10 !rounded-3xl flex flex-col shadow-2xl overflow-hidden">
                                        <div className="p-5 border-b border-white/10 flex justify-between items-center">
                                            <h2 className="font-bold text-lg flex items-center gap-2">
                                                <PenTool className="w-5 h-5 text-pink-400" />
                                                Viktorinalar
                                            </h2>
                                            <button onClick={() => setShowQuizzes(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                                                <X className="w-5 h-5 opacity-50" />
                                            </button>
                                        </div>
                                        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                                            {quizzes.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                                                    <PenTool className="w-12 h-12" />
                                                    <p className="text-sm font-medium">Hozircha faol viktorina yo&apos;q</p>
                                                </div>
                                            ) : (
                                                quizzes.map(quiz => (
                                                    <div key={quiz.id} className="mb-8 last:mb-0 animate-in fade-in zoom-in-95 duration-500">
                                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                                                            <h3 className="font-bold text-base mb-1">{quiz.title}</h3>
                                                            <p className="text-xs text-white/50">{quiz.questions?.length} ta savol</p>
                                                        </div>
                                                        {quiz.questions?.map((q: any, i: number) => {
                                                            const selectedOption = quizAnswers[quiz.id]?.[i];
                                                            return (
                                                                <div key={i} className="mb-6 last:mb-0">
                                                                    <p className="text-sm font-semibold mb-4 text-white/90 leading-relaxed">
                                                                        <span className="text-blue-400 mr-2">{i + 1}.</span>
                                                                        {q.text}
                                                                    </p>
                                                                    <div className="flex flex-col gap-2.5">
                                                                        {q.options?.map((opt: any) => (
                                                                            <button
                                                                                key={opt.id}
                                                                                onClick={() => handleSelectAnswer(quiz.id, i, opt.id)}
                                                                                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${selectedOption === opt.id ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/20'}`}
                                                                            >
                                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${selectedOption === opt.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'}`}>
                                                                                    {opt.id}
                                                                                </div>
                                                                                <span className="text-sm font-medium">{opt.label || opt.text}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <button onClick={() => handleSubmitQuiz(quiz.id)} className="w-full mt-2 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98]">
                                                            YUBORISH
                                                        </button>
                                                    </div>
                                                )
                                                ))}
                                        </div>
                                    </GlassCard>
                                )}
                                {showChat && (
                                    <LiveChatPanel socket={socket} sessionId={sessionId} user={user} className="flex-1 !bg-black/60 backdrop-blur-2xl !border-white/10 shadow-2xl !rounded-3xl" />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. BOTTOM OVERLAY: Controls Bar */}
                <div className="absolute bottom-10 inset-x-0 flex justify-center z-40 pointer-events-none">
                    <div className="flex items-center gap-3 p-3 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl pointer-events-auto scale-110">
                        <StudentMediaControls />

                        <div className="w-px h-8 bg-white/10 mx-1" />

                        <ControlToggleButton
                            active={showMaterials}
                            onClick={() => { setShowMaterials(!showMaterials); }}
                            icon={<FileText className="w-5 h-5" />}
                            color="blue"
                            label="Fayllar"
                        />
                        <ControlToggleButton
                            active={showQuizzes}
                            onClick={() => { setShowQuizzes(!showQuizzes); }}
                            icon={<PenTool className="w-5 h-5" />}
                            color="pink"
                            label="Test"
                        />
                        <div className="w-px h-8 bg-white/10 mx-1" />
                        <ControlToggleButton
                            active={showChat}
                            onClick={() => { setShowChat(!showChat); }}
                            icon={<MessageSquare className="w-5 h-5" />}
                            color="emerald"
                            label="Chat"
                        />
                    </div>
                </div>

                {/* 5. FLOATING COMPONENT: Whiteboard / Screen Share Info (If needed) */}
                {/* Handled by LiveVideoFrame */}
            </LiveKitRoom>

            {/* Quick Poll Modal Overlay */}
            {activePoll && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
                    <div className="w-full max-w-sm bg-[#1c1f2b] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                        <h2 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                            <span className="p-2 bg-blue-500 rounded-xl">⚡</span>
                            TEZKOR SO&apos;ROV
                        </h2>
                        <p className="text-base text-white/80 mb-8 font-medium leading-relaxed">{activePoll.questions?.[0]?.text}</p>

                        <div className="grid grid-cols-2 gap-4">
                            {activePoll.questions?.[0]?.options?.map((opt: any) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswerPoll(activePoll.id, 0, opt.id)}
                                    className="py-4 px-4 rounded-2xl bg-white/5 hover:bg-blue-500 border border-white/10 text-sm font-black text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                                >
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StudentMediaControls() {
    const { localParticipant } = useLocalParticipant();
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCamEnabled, setIsCamEnabled] = useState(true);

    const toggleMic = async () => {
        const nextState = !isMicEnabled;
        await localParticipant.setMicrophoneEnabled(nextState);
        setIsMicEnabled(nextState);
    };

    const toggleCam = async () => {
        const nextState = !isCamEnabled;
        await localParticipant.setCameraEnabled(nextState);
        setIsCamEnabled(nextState);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleMic}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!isMicEnabled ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                title={isMicEnabled ? "Mikrofonni o&apos;chirish" : "Mikrofonni yoqish"}
            >
                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
                onClick={toggleCam}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!isCamEnabled ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                title={isCamEnabled ? "Kamerani o&apos;chirish" : "Kamerani yoqish"}
            >
                {isCamEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
        </div>
    );
}

interface ControlButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    color: 'blue' | 'pink' | 'emerald';
    label: string;
}

function ControlToggleButton({ active, onClick, icon, color, label }: ControlButtonProps) {
    const colorClasses = {
        blue: active ? 'bg-blue-500 text-white shadow-blue-500/40' : 'text-blue-400 hover:bg-blue-500/10',
        pink: active ? 'bg-pink-500 text-white shadow-pink-500/40' : 'text-pink-400 hover:bg-pink-500/10',
        emerald: active ? 'bg-emerald-500 text-white shadow-emerald-500/40' : 'text-emerald-400 hover:bg-emerald-500/10',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full font-bold text-xs transition-all duration-300 relative group ${colorClasses[color]} ${active ? 'shadow-lg scale-105' : ''}`}
        >
            <span className="transition-transform group-hover:scale-110">{icon}</span>
            <span className="tracking-widest uppercase">{label}</span>
        </button>
    );
}
