"use client";

import React, { useState } from 'react';
import {
    MoreHorizontal,
    FileText,
    Video as VideoIcon,
    Link as LinkIcon,
    Mic,
    Camera,
    Circle,
    Volume2,
    Edit2,
    MessageSquare,
    Send,
    Plus,
    Users,
    Monitor,
    Clock,
    Signal,
    Bell,
    ChevronDown,
    Check,
    Upload,
    ClipboardList,
    BookOpen,
    HelpCircle,
    AlignLeft,
    ArrowLeft,
    UserPlus,
} from 'lucide-react';

interface SpecialistDashboardProps {
    user: any;
    sessionId?: string;
    socket?: any;
    onBack?: () => void;
}

export default function SpecialistDashboard({ user, sessionId, socket, onBack }: SpecialistDashboardProps) {
    const [activeTab, setActiveTab] = useState<'attendees' | 'materials' | 'chat'>('attendees');
    const [sessionNotes, setSessionNotes] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [quizScore] = useState({ current: 8, total: 8 });
    const [sessionTime] = useState('00:32');
    const [participantCount] = useState(84);

    // Dynamic Materials State
    const [materials, setMaterials] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Live Quiz State
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<any>(null); // currently running quiz
    const [quizResults, setQuizResults] = useState<{ [studentId: string]: number }>({}); // incoming scores
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [newQuizTitle, setNewQuizTitle] = useState('');
    const [newQuestions, setNewQuestions] = useState([{ text: '', typeof: 'multiple_choice', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]);

    React.useEffect(() => {
        if (!sessionId) return;

        // Fetch existing materials
        const fetchMaterials = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}/materials`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMaterials(data);
                }
            } catch (err) {
                console.error("Failed to fetch materials", err);
            }
        };

        // Fetch existing quizzes
        const fetchQuizzes = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}/quizzes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuizzes(data);
                }
            } catch (err) {
                console.error("Failed to fetch quizzes", err);
            }
        };

        fetchMaterials();
        fetchQuizzes();

        // Socket Listeners
        if (socket) {
            const handleNewMaterial = (newMaterial: any) => {
                setMaterials(prev => {
                    if (prev.some(m => m.id === newMaterial.id)) return prev;
                    return [newMaterial, ...prev];
                });
            };
            const handleQuizResultUpdate = (resultData: any) => {
                // Someone answered the live quiz
                setQuizResults(prev => ({
                    ...prev,
                    [resultData.studentId]: resultData.score || 0
                }));
            };

            socket.on('material_new', handleNewMaterial);
            socket.on('quiz_result_update', handleQuizResultUpdate);
            return () => {
                socket.off('material_new', handleNewMaterial);
                socket.off('quiz_result_update', handleQuizResultUpdate);
            };
        }
    }, [sessionId, socket]);

    const handleCreateQuiz = async () => {
        if (!newQuizTitle || !sessionId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}/quizzes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newQuizTitle, questions: newQuestions })
            });

            if (res.ok) {
                const data = await res.json();
                // We'll trust our fetchQuizzes or push it manually
                setQuizzes(prev => [...prev, { id: data.quizId, title: newQuizTitle, questions: newQuestions }]);
                setIsCreatingQuiz(false);
                setNewQuizTitle('');
                // reset form
                setNewQuestions([{ text: '', typeof: 'multiple_choice', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleBroadcastQuiz = (quiz: any) => {
        if (!socket || !sessionId) return;
        socket.emit('quiz_start', { sessionId, quizId: quiz.id, quizDetails: quiz });
        setActiveQuiz(quiz);
        setQuizResults({}); // reset scores for this run
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sessionId) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('material', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}/materials`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const newMaterial = await res.json();
                // Material comes back, notify others via socket
                if (socket) {
                    socket.emit('material_uploaded', { sessionId, material: newMaterial });
                }
                setMaterials(prev => [newMaterial, ...prev]);
            } else {
                alert('Failed to upload material');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Upload error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const attendees = ['Jessica', 'Alex', 'Samira', 'Liam'];
    const smallVideoUrls = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop',
    ];

    return (
        <div className="flex flex-col h-full bg-[#0f1117] text-slate-200 font-sans overflow-hidden">

            {/* ─── TOP NAVIGATION BAR ─── */}
            <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-[#1a1d2e] border-b border-white/5 gap-3">
                {/* Left: back + title */}
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Mentor" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                {user?.name?.[0] || 'M'}
                            </div>
                        )}
                        <span className="text-sm font-bold text-white">Mentor Dashboard</span>
                    </div>
                </div>

                {/* Center: Session stats */}
                <div className="flex items-center gap-5 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-mono font-semibold">Session Time: {sessionTime}</span>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">{participantCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        REC
                    </div>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map(i => (
                            <span key={i} className={`w-1 h-${2 + i} rounded-full ${i === 3 ? 'bg-white' : 'bg-slate-500'}`} />
                        ))}
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold border border-white/10 transition-all">
                        End Session
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex items-center gap-2 px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all">
                        <VideoIcon className="w-4 h-4" />
                        AuteCam
                    </button>
                    <button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all">
                        <Bell className="w-4 h-4" />
                    </button>
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="User" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {user?.name?.[0] || 'U'}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ═══ LEFT PANEL ═══ */}
                <div className="w-56 shrink-0 flex flex-col bg-[#161927] border-r border-white/5 overflow-y-auto no-scrollbar">

                    {/* Manage Session */}
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Manage Session</span>
                        <button className="text-slate-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 mx-2 mb-3">
                        {(['attendees', 'materials', 'chat'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 text-[11px] font-semibold capitalize transition-colors ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* ATTENDEES tab */}
                    {activeTab === 'attendees' && (
                        <div className="flex flex-col flex-1">
                            {/* Mentor Card */}
                            <div className="mx-3 p-3 rounded-xl bg-white/5 mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt="U" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                            {user?.name?.[0] || 'T'}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs font-bold text-white">{user?.name || 'Tessa Walker'}</div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-[10px] text-green-400 font-semibold">Mentor</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"><UserPlus className="w-3 h-3" /></button>
                            </div>

                            {/* All Participants */}
                            <div className="mx-3 mb-2 flex items-center justify-between px-1">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                                    <span>—</span>
                                    <span>All Participants ({participantCount})</span>
                                </div>
                                <button className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"><UserPlus className="w-3 h-3" /></button>
                            </div>

                            {/* Active Quiz Visualizer if running */}
                            {activeQuiz ? (
                                <>
                                    <div className="mx-3 mb-1 p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-red-500 animate-pulse flex items-center justify-center">
                                                <ClipboardList className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white">LIVE: {activeQuiz.title}</span>
                                                <span className="text-[10px] text-blue-300">{Object.keys(quizResults).length} replies received</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setActiveQuiz(null)} className="px-2 py-1 bg-white/10 text-[10px] rounded hover:bg-white/20">STOP</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {quizzes.length > 0 && quizzes.map((q, i) => (
                                        <div key={i} className="mx-3 mb-1 p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white">{q.title}</span>
                                                <span className="text-[10px] text-slate-400">{q.questions?.length || 0} Questions</span>
                                            </div>
                                            <button
                                                onClick={() => handleBroadcastQuiz(q)}
                                                className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                START LIVE
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => setIsCreatingQuiz(true)} className="mx-3 mb-3 mt-1 py-1.5 text-xs font-semibold text-blue-400 border border-dashed border-blue-500/30 rounded-lg hover:bg-blue-500/10 text-center transition-colors">
                                        + Create New Quiz
                                    </button>
                                </>
                            )}

                            {/* Current Quiz (Archived specific layout) */}
                            <div className="mx-3 mb-2">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                        <span className="w-4 h-4 rounded-full bg-blue-700 flex items-center justify-center text-[8px]">B</span>
                                        Benorpine (5)
                                    </div>
                                    <button className="text-slate-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                                </div>
                                {attendees.map((name, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 px-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=1e293b`} alt={name} className="w-full h-full" />
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#161927]" />
                                            </div>
                                            <span className="text-xs font-medium text-white">{name}</span>
                                            {name === 'Jessica' && <span className="text-base">👏</span>}
                                        </div>
                                        {i === attendees.length - 1 && (
                                            <span className="text-[10px] text-slate-500">+79</span>
                                        )}
                                    </div>
                                ))}
                                <div className="flex items-center gap-1 px-1 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-slate-500 text-[10px] font-bold">+12</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MATERIALS tab */}
                    {activeTab === 'materials' && (
                        <div className="flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar pb-4 block">
                            {materials.length === 0 ? (
                                <div className="text-center text-xs text-slate-500 py-4">No materials uploaded yet</div>
                            ) : (
                                materials.map((mat) => {
                                    const isVideo = mat.file_type?.includes('video');
                                    return (
                                        <a href={`http://localhost:5000${mat.file_url}`} target="_blank" rel="noreferrer" key={mat.id} className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold text-slate-300">
                                            {isVideo ? (
                                                <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center shrink-0"><VideoIcon className="w-2.5 h-2.5 text-white" /></div>
                                            ) : (
                                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                            <span className="truncate">{mat.title}</span>
                                        </a>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* CHAT tab */}
                    {activeTab === 'chat' && (
                        <div className="flex flex-col flex-1 gap-2 px-3">
                            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                                {[{ name: 'Jessica', msg: "Can't wait to start the quiz!" }, { name: 'Alex', msg: "I'm ready!" }, { name: 'Samira', msg: 'Please share the study guide.' }].map((m, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}&backgroundColor=1e293b`} className="w-6 h-6 rounded-full" alt="" />
                                        <div>
                                            <span className="text-[10px] font-bold text-white">{m.name}: </span>
                                            <span className="text-[10px] text-slate-400">{m.msg}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="relative mt-auto">
                                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none placeholder:text-slate-600" />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60">
                                    <Send className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ CENTER PANEL (VIDEO) ═══ */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0d0f1a]">

                    {/* Big main video */}
                    <div className="flex-1 relative overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop"
                            alt="Mentor"
                            className="w-full h-full object-cover"
                        />
                        {/* Recording badge */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-white">Recording...</span>
                        </div>
                    </div>

                    {/* Quiz status bar */}
                    <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-[#1a2035] border-t border-b border-white/5">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 shrink-0">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-white">History Quiz:</span>
                        <span className="text-sm text-slate-300">
                            <span className="text-white font-bold">{quizScore.current}/{quizScore.total}</span> Students Completed
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                            <button className="px-3 h-7 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all">All</button>
                            <button className="w-7 h-7 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                            <button className="w-7 h-7 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all flex items-center justify-center"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Small videos grid */}
                    <div className="h-[178px] shrink-0 grid grid-cols-5 bg-[#0d0f1a] p-2 gap-2">
                        {smallVideoUrls.slice(0, 5).map((url, i) => (
                            <div key={i} className="rounded-xl overflow-hidden relative bg-slate-800">
                                <img src={url} alt={attendees[i] || `Student ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                                    {attendees[i] || `Student ${i + 1}`}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom control bar */}
                    <div className="h-14 shrink-0 flex items-center justify-center gap-3 bg-[#161927] border-t border-white/5 px-6">
                        <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all" title="Microphone">
                            <Mic className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all" title="Camera">
                            <VideoIcon className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all" title="Participants">
                            <Users className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all scale-110" title="Screen Share">
                            <Monitor className="w-6 h-6" />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all" title="Camera">
                            <Camera className="w-5 h-5" />
                        </button>
                        <button className="h-10 px-4 rounded-xl bg-white/10 flex items-center gap-2 text-white hover:bg-white/20 transition-all" title="Record">
                            <Circle className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">REC</span>
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all" title="Volume">
                            <Users className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ═══ RIGHT PANEL ═══ */}
                <div className="w-64 shrink-0 flex flex-col bg-[#161927] border-l border-white/5 overflow-y-auto no-scrollbar">

                    {/* Materials & Quizzes */}
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Materials & Quizzes</span>
                        <button className="text-slate-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>

                    {/* Upload / Create */}
                    <div className="px-3 mb-3 flex gap-2">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || !sessionId}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-semibold text-slate-300 border border-white/10 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Plus className="w-3 h-3" /> {isUploading ? 'Uploading...' : 'Upload Material'}
                        </button>
                        <button
                            onClick={() => setIsCreatingQuiz(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-semibold text-slate-300 border border-white/10"
                        >
                            <Plus className="w-3 h-3" /> Create Quiz
                        </button>
                    </div>

                    {/* Quiz completion badge */}
                    {activeQuiz && (
                        <div className="mx-3 mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">{activeQuiz.title}</div>
                                <div className="text-[10px] text-green-400">{Object.keys(quizResults).length} Students Completed</div>
                            </div>
                        </div>
                    )}

                    {/* Course Materials */}
                    <div className="px-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400">Course Materials</span>
                            <button className="text-slate-600 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1.5">
                            {materials.length === 0 ? (
                                <div className="text-xs text-slate-500 italic py-2">No materials available</div>
                            ) : (
                                materials.map((mat) => {
                                    const isVideo = mat.file_type?.includes('video');
                                    return (
                                        <a href={`http://localhost:5000${mat.file_url}`} target="_blank" rel="noreferrer" key={mat.id} className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
                                            {isVideo ? (
                                                <div className="w-3.5 h-3.5 rounded bg-blue-500 flex items-center justify-center shrink-0"><VideoIcon className="w-2 h-2 text-white" /></div>
                                            ) : (
                                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            )}
                                            <span className="text-xs font-medium text-slate-300 group-hover:text-white flex-1 truncate">{mat.title}</span>
                                            <MoreHorizontal className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="mx-3 h-px bg-white/5 mb-3" />

                    {/* Create New Quiz */}
                    <div className="px-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400">Create New Quiz</span>
                            <button className="text-slate-600 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1.5">
                            {[
                                { icon: <HelpCircle className="w-3.5 h-3.5" />, label: 'New Multiple Choice' },
                                { icon: <Check className="w-3.5 h-3.5" />, label: 'New True/False' },
                                { icon: <AlignLeft className="w-3.5 h-3.5" />, label: 'New Open Question' },
                            ].map(({ icon, label }, i) => (
                                <button key={i} className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
                                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-white">
                                        <Plus className="w-3 h-3" />
                                        {icon}
                                    </div>
                                    <span className="text-xs font-medium text-slate-300 group-hover:text-white flex-1">{label}</span>
                                    <MoreHorizontal className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mx-3 h-px bg-white/5 mb-3" />

                    {/* Session Notes */}
                    <div className="px-3 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400">Session Notes</span>
                            <button className="text-slate-600 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                        <textarea
                            value={sessionNotes}
                            onChange={e => setSessionNotes(e.target.value)}
                            placeholder="Write session notes here..."
                            className="w-full h-32 bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-white/20 transition-colors placeholder:text-slate-600"
                        />
                        <button className="w-full mt-2 mb-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/10">
                            Save Note
                        </button>
                    </div>

                    {/* End Session bottom bar */}
                    <div className="mx-3 mb-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                            <Users className="w-3.5 h-3.5" />
                        </div>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/20 transition-all">
                            End
                        </button>
                        <button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 border border-white/10">
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* CREATE QUIZ MODAL */}
            {isCreatingQuiz && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#161927] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                        <h2 className="text-lg font-bold text-white mb-4">Create Live Quiz</h2>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                            <div>
                                <label className="text-xs text-slate-400 font-bold mb-1 block">Quiz Title</label>
                                <input
                                    type="text"
                                    value={newQuizTitle}
                                    onChange={e => setNewQuizTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Mid-Session Knowledge Check"
                                />
                            </div>

                            {newQuestions.map((q, qIndex) => (
                                <div key={qIndex} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-white">Question {qIndex + 1}</span>
                                        {newQuestions.length > 1 && (
                                            <button onClick={() => setNewQuestions(prev => prev.filter((_, i) => i !== qIndex))} className="text-red-400 text-xs">Remove</button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={q.text}
                                        onChange={e => {
                                            const arr = [...newQuestions];
                                            arr[qIndex].text = e.target.value;
                                            setNewQuestions(arr);
                                        }}
                                        className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white mb-2 focus:outline-none focus:border-white/20"
                                        placeholder="Question text..."
                                    />

                                    <div className="space-y-1.5 pl-2 border-l border-white/10 mt-3">
                                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Options (Check correct)</span>
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`q-${qIndex}-correct`}
                                                    checked={opt.isCorrect}
                                                    onChange={() => {
                                                        const arr = [...newQuestions];
                                                        // clear others
                                                        arr[qIndex].options.forEach(o => o.isCorrect = false);
                                                        arr[qIndex].options[oIndex].isCorrect = true;
                                                        setNewQuestions(arr);
                                                    }}
                                                    className="w-3 h-3 cursor-pointer shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={e => {
                                                        const arr = [...newQuestions];
                                                        arr[qIndex].options[oIndex].text = e.target.value;
                                                        setNewQuestions(arr);
                                                    }}
                                                    className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                                                    placeholder="Option text..."
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setNewQuestions(prev => [...prev, { text: '', typeof: 'multiple_choice', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }])}
                                className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs text-slate-400 hover:text-white hover:border-white/40 transiton-all"
                            >
                                + Add Another Question
                            </button>
                        </div>

                        <div className="pt-4 mt-2 border-t border-white/10 flex gap-2">
                            <button onClick={() => setIsCreatingQuiz(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10">Cancel</button>
                            <button onClick={handleCreateQuiz} disabled={!newQuizTitle} className={`flex-1 py-2 rounded-xl text-white text-xs font-bold ${newQuizTitle ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 cursor-not-allowed'}`}>Save Quiz</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
