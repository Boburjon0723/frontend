"use client";

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { GlassCard } from '../ui/GlassCard';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    GridLayout
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
    Send,
    LogOut,
    Menu,
    MoreHorizontal
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Track } from 'livekit-client';

interface StudentDashboardProps {
    user: any;
    sessionId: string;
    onLeave: () => void;
}

export default function StudentDashboard({ user, sessionId, onLeave }: StudentDashboardProps) {
    const { socket } = useSocket();
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Sidebar States
    const [materials, setMaterials] = useState<any[]>([
        { id: 1, title: 'Introduction Lesson.pdf', type: 'pdf' },
        { id: 2, title: 'Study Guide Video.mp4', type: 'video' },
        { id: 3, title: 'Reference Links', type: 'link' }
    ]);

    // Demo Quizzes
    const [quizzes, setQuizzes] = useState<any[]>([
        {
            id: 1,
            title: 'History Quiz',
            questions: [
                {
                    text: 'Who was the first President of the United States?',
                    options: [
                        { id: 'A', label: 'George Washington' },
                        { id: 'B', label: 'Thomas Jefferson' },
                        { id: 'C', label: 'Abraham Lincoln' }
                    ],
                    selected: 'A'
                },
                {
                    text: 'When did World War II end?',
                    options: [
                        { id: 'A', label: '1939' },
                        { id: 'B', label: '1945' },
                        { id: 'C', label: '1950' }
                    ],
                    selected: null
                }
            ]
        }
    ]);

    const [chatMessages, setChatMessages] = useState<any[]>([
        { id: 1, sender: 'Jessica', text: "Can't wait to start the quiz!", avatar: "https://i.pravatar.cc/150?img=1" },
        { id: 2, sender: 'Alex', text: "I'm ready!", avatar: "https://i.pravatar.cc/150?img=2" },
        { id: 3, sender: 'Michael', text: "Please share the study guide.", avatar: "https://i.pravatar.cc/150?img=3" }
    ]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await apiFetch(`/api/livekit/token?room=${sessionId}&username=${encodeURIComponent(user?.name || 'Talaba')}`);
                if (res.ok) {
                    const data = await res.json();
                    setToken(data.token);
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

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-[#11131a] text-white overflow-hidden font-sans">
            {/* Header */}
            <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-6 bg-[#161821] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={user?.avatar || "https://i.pravatar.cc/150?img=5"} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#161821]"></div>
                    </div>
                    <h1 className="text-lg font-medium tracking-wide"><span className="font-bold">Student</span> Dashboard</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-white/60 hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-[#161821]"></span>
                    </button>
                    <button className="p-2 text-white/60 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <img src={user?.avatar || "https://i.pravatar.cc/150?img=5"} alt="avatar" className="w-8 h-8 rounded-full ml-2 object-cover" />
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
                            {materials.map(mat => (
                                <div key={mat.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5">
                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${mat.type === 'pdf' ? 'bg-white/10 text-white' : mat.type === 'video' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white'}`}>
                                        {mat.type === 'pdf' ? <FileText className="w-4 h-4" /> : mat.type === 'video' ? <Video className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                    </div>
                                    <span className="text-sm font-medium text-white/90 truncate">{mat.title}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Live Test Card */}
                    <GlassCard className="flex-1 !bg-[#1c1f2b] !rounded-xl !border-transparent flex flex-col overflow-hidden max-h-[50%]">
                        <div className="p-4 border-b border-white/5">
                            <h2 className="font-bold text-[15px]">Live Test</h2>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="border border-white/10 bg-white/[0.02] rounded-xl p-4 mb-auto">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                                            <PenTool className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm">History Quiz</h3>
                                            <p className="text-[11px] text-white/50">2 Questions Remaining</p>
                                        </div>
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-white/40 cursor-pointer hover:text-white" />
                                </div>
                                <button className="w-full py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/25 transition-all mt-2">
                                    Start Quiz
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* CENTER: LiveKit Video Area */}
                <div className="flex-1 min-w-0 bg-[#000000] rounded-xl overflow-hidden relative flex flex-col border border-white/5 shadow-2xl">
                    <LiveKitRoom
                        video={true}
                        audio={true}
                        token={token}
                        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://mali-livekit-tl6r65ar.livekit.cloud'}
                        data-lk-theme="default"
                        className="flex-1 flex flex-col w-full h-full relative"
                    >
                        <VideoConference className="flex-1" />
                        <RoomAudioRenderer />

                        {/* Custom Control Bar Overlay */}
                        {/* We use LiveKit's built-in tools primarily, but customized via CSS. The bottom bar in the image is replicated by standard LiveKit controls styled via global css or we override slightly */}
                    </LiveKitRoom>
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
                            {quizzes.map(quiz => (
                                <div key={quiz.id} className="animate-fade-in">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black">1</div>
                                        <div>
                                            <h3 className="font-bold text-[15px]">{quiz.title}</h3>
                                            <p className="text-[11px] text-white/50"><span className="text-white font-bold">2 Questions</span> Remaining</p>
                                        </div>
                                    </div>

                                    {quiz.questions.map((q: any, i: number) => (
                                        <div key={i} className="mb-5 last:mb-0">
                                            <p className="text-sm font-medium mb-3 flex gap-2">
                                                <span className="font-bold">{i + 1}.</span>
                                                <span className="text-white/90 leading-relaxed">{q.text}</span>
                                            </p>
                                            <div className="flex flex-col gap-2 pl-4">
                                                {q.options.map((opt: any) => (
                                                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="radio"
                                                            name={`q_${i}`}
                                                            checked={q.selected === opt.id}
                                                            onChange={() => { }} // Connect to state later
                                                            className="hidden"
                                                        />
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${q.selected === opt.id ? 'border-blue-500' : 'border-white/30 group-hover:border-white/60'}`}>
                                                            {q.selected === opt.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <span className="font-bold text-white/70 w-4">{opt.id}</span>
                                                            <span className={q.selected === opt.id ? 'text-white font-medium' : 'text-white/70'}>{opt.label}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <button className="w-full mt-4 py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/25 transition-all">
                                        Submit Answers
                                    </button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Chat Box */}
                    <GlassCard className="flex-1 !bg-[#1c1f2b] !rounded-xl !border-transparent flex flex-col overflow-hidden max-h-[40%]">
                        <div className="p-3 border-b border-white/5 flex justify-between items-center">
                            <h2 className="font-bold text-[15px] pl-1">Chat</h2>
                            <MoreHorizontal className="w-4 h-4 text-white/40 cursor-pointer hover:text-white" />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className="flex gap-2.5 text-sm animate-slide-up">
                                    <img src={msg.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                    <div>
                                        <p className="leading-snug">
                                            <span className="font-bold text-white/80 mr-1">{msg.sender}:</span>
                                            <span className="text-white/70 break-words">{msg.text}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-white/[0.02]">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    className="w-full bg-[#272b38] rounded-xl py-2.5 px-4 pr-10 text-sm text-white placeholder-white/40 border-none outline-none focus:ring-1 ring-blue-500/50"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white bg-transparent outline-none">
                                    <Send className="w-4 h-4 -ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </GlassCard>
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

        </div>
    );
}
