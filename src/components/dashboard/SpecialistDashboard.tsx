"use client";

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useLocalParticipant,
    useTracks,
    useConnectionState,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import { LiveVideoFrame } from './shared/LiveVideoFrame';
import '@livekit/components-styles';

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
    MicOff,
    VideoOff,
    MonitorUp,
    LogOut,
    LayoutGrid,
    Settings,
    Maximize2,
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
    const [quizScore] = useState({ current: 0, total: 0 });
    const [sessionTime] = useState('00:00');
    const [participantCount, setParticipantCount] = useState(0);

    // Dynamic Materials State
    const [materials, setMaterials] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Groups State
    const [groups, setGroups] = useState([
        { id: '1', name: 'Oliy Tarix', time: '14:00' },
        { id: '2', name: 'Ingliz tili (IELTS)', time: '16:30' },
    ]);
    const [selectedGroupId, setSelectedGroupId] = useState('1');
    const [showNewGroupPrompt, setShowNewGroupPrompt] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupTime, setNewGroupTime] = useState('');

    // Live Quiz State
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<any>(null); // currently running quiz
    const [quizResults, setQuizResults] = useState<{ [studentId: string]: number }>({}); // incoming scores
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [newQuizTitle, setNewQuizTitle] = useState('');
    const [newQuestions, setNewQuestions] = useState([{ text: '', typeof: 'multiple_choice', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]);

    // Booking Requests State
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    // Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([]);

    // Media State
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Modal States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBreakoutOpen, setIsBreakoutOpen] = useState(false);

    // LiveKit States
    const [lkToken, setLkToken] = useState<string>("");
    const [lkWsUrl, setLkWsUrl] = useState<string>("");

    // Participants & Video Tracks

    const [attendees, setAttendees] = useState<any[]>([]);
    const [smallVideoUrls, setSmallVideoUrls] = useState<string[]>([]);



    React.useEffect(() => {
        if (!selectedGroupId) return;

        // Fetch existing materials
        const fetchMaterials = async () => {
            try {
                const res = await apiFetch(`/api/sessions/${selectedGroupId}/materials`);
                if (res.ok) {
                    const data = await res.json();
                    setMaterials(data);
                }
            } catch (err) {
                console.error("Failed to fetch materials", err);
            }
        };

        const fetchQuizzes = async () => {
            try {
                const res = await apiFetch(`/api/sessions/${selectedGroupId}/quizzes`);
                if (res.ok) {
                    const data = await res.json();
                    setQuizzes(data);
                }
            } catch (err) {
                console.error("Failed to fetch quizzes", err);
            }
        };

        const fetchBookings = async () => {
            setIsLoadingBookings(true);
            try {
                const res = await apiFetch(`/api/wallet/my-bookings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setBookings(data.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch bookings", err);
            } finally {
                setIsLoadingBookings(false);
            }
        };


        fetchMaterials();
        fetchQuizzes();
        fetchBookings();

        // Fetch LiveKit Token
        const fetchLiveKitToken = async () => {
            try {
                const res = await apiFetch(`/api/livekit/token?room=${selectedGroupId}`);
                if (res.ok) {
                    const data = await res.json();
                    setLkToken(data.token);
                    setLkWsUrl(data.wsUrl);
                }
            } catch (err) {
                console.error("Failed to fetch LiveKit token", err);
            }
        };
        fetchLiveKitToken();

        // Socket Listeners
        if (socket && selectedGroupId) {
            socket.emit('join_room', selectedGroupId);

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

            const handleNewBooking = (notification: any) => {
                // Add to list if not already there
                if (notification.type === 'booking_new') {
                    fetchBookings(); // Refresh list
                }
            };

            const handleNewChatMessage = (msg: any) => {
                // If it's a session chat receive event
                const formattedMsg = {
                    id: msg.id || Date.now(),
                    text: msg.content || msg.text || '',
                    sender: msg.sender_name || msg.sender || "Foydalanuvchi",
                    avatar: msg.sender_avatar || msg.avatar || "https://i.pravatar.cc/150?img=5",
                    timestamp: msg.created_at || new Date().toISOString()
                };
                setChatMessages(prev => {
                    if (prev.some(p => p.id === formattedMsg.id)) return prev;
                    return [...prev, formattedMsg];
                });
            };

            const handleParticipantJoined = (participant: any) => {
                setAttendees(prev => {
                    if (prev.some(p => p.id === participant.id)) return prev;
                    return [...prev, participant];
                });
                setParticipantCount(prev => prev + 1);
            };

            const handleParticipantLeft = (participantId: string) => {
                setAttendees(prev => prev.filter(p => p.id !== participantId));
                setParticipantCount(prev => Math.max(0, prev - 1));
            };

            socket.on('material_new', handleNewMaterial);
            socket.on('quiz_result_update', handleQuizResultUpdate);
            socket.on('new_notification', handleNewBooking);
            socket.on('session_chat:receive', handleNewChatMessage);
            socket.on('participant_joined', handleParticipantJoined);
            socket.on('participant_left', handleParticipantLeft);
            return () => {
                socket.off('material_new', handleNewMaterial);
                socket.off('quiz_result_update', handleQuizResultUpdate);
                socket.off('new_notification', handleNewBooking);
                socket.off('session_chat:receive', handleNewChatMessage);
                socket.off('participant_joined', handleParticipantJoined);
                socket.off('participant_left', handleParticipantLeft);
            };

        }

    }, [selectedGroupId, socket]);

    const handleCreateQuiz = async () => {
        if (!newQuizTitle || !selectedGroupId) return;
        try {
            const res = await apiFetch(`/api/sessions/${selectedGroupId}/quizzes`, {
                method: 'POST',
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
        if (!socket || !selectedGroupId) return;
        socket.emit('quiz_start', { sessionId: selectedGroupId, quizId: quiz.id, quizDetails: quiz });
        setActiveQuiz(quiz);
        setQuizResults({}); // reset scores for this run
    };

    const handleAcceptBooking = (booking: any) => {
        const inviteLink = `${window.location.origin}/messages?room=${selectedGroupId}`;
        navigator.clipboard.writeText(inviteLink);

        if (socket) {
            socket.emit('booking_accept', {
                studentId: booking.sender_id,
                url: inviteLink
            });
        }

        setBookings((prev: any[]) => prev.filter(b => b.id !== booking.id));
        alert(`${booking.student_name || 'Talaba'} qabul qilindi! Havola nusxalandi va talabaga bildirishnoma yuborildi.`);
    };

    const handleRejectBooking = (bookingId: string) => {
        setBookings((prev: any[]) => prev.filter(b => b.id !== bookingId));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGroupId) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('material', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/sessions/${selectedGroupId}/materials`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });


            if (res.ok) {
                const newMaterial = await res.json();
                // Material comes back, notify others via socket
                if (socket) {
                    socket.emit('material_uploaded', { sessionId: selectedGroupId, material: newMaterial });
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

    const handleEndSession = async () => {
        if (!window.confirm('Darsni yakunlashni xohlaysizmi? MALI kafillikdan yechiladi.')) return;
        try {
            const res = await apiFetch(`/api/specialists/sessions/${selectedGroupId}/close`, {
                method: 'PATCH'
            });

            if (res.ok) {
                alert('Dars muvaffaqiyatli yakunlandi.');
                if (onBack) onBack();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleMic = () => {
        setIsMicOn(!isMicOn);
        // Real-time: localAudioTrack.setEnabled(!isMicOn)
        if (socket) socket.emit('media_state_change', { sessionId, type: 'audio', enabled: !isMicOn });
    };

    const handleToggleCam = () => {
        setIsCamOn(!isCamOn);
        // Real-time: localVideoTrack.setEnabled(!isCamOn)
        if (socket) socket.emit('media_state_change', { sessionId, type: 'video', enabled: !isCamOn });
    };

    const handleToggleScreenShare = () => {
        setIsScreenSharing(!isScreenSharing);
        // Real-time: getDisplayMedia() -> publishTrack
    };

    const handleToggleRecording = () => {
        setIsRecording(!isRecording);
        // Real-time: Call Egress API via Backend
        const state = !isRecording ? 'start' : 'stop';
        apiFetch(`/api/sessions/${sessionId}/record/${state}`, {
            method: 'POST'
        });

    };

    const handleForceMuteStudent = (studentId: string) => {
        if (socket) socket.emit('force_mute_student', { sessionId, studentId });
        alert(`Student (ID: ${studentId}) ovozi o'chirildi.`);
    };

    const handleRemoveStudent = (studentId: string) => {
        if (!window.confirm('Talabani darsdan chiqarishni xohlaysizmi?')) return;
        if (socket) socket.emit('kick_student', { sessionId, studentId });
        setAttendees(prev => prev.filter(a => a.id !== studentId));
    };

    const handleStartBreakout = (count: number) => {
        if (socket) socket.emit('create_breakout_groups', { sessionId, groupCount: count });
        setIsBreakoutOpen(false);
        alert(`${count} ta guruh yaratildi va talabalar taqsimlandi.`);
    };

    const handleSendMessage = (isPrivate = false, receiverId?: string) => {
        if (!chatInput.trim() || !socket || !sessionId) return;

        const payload = {
            sessionId: selectedGroupId,
            receiverId: receiverId,
            content: chatInput.trim(),
            type: 'text'
        };

        socket.emit('session_chat:send', payload);

        // Let the receive event handle updating local state
        setChatInput('');
    };



    const handleSaveNote = async () => {
        if (!sessionNotes.trim() || !sessionId) return;
        try {
            const res = await apiFetch(`/api/specialists/notes`, {
                method: 'POST',
                body: JSON.stringify({ session_id: sessionId, content: sessionNotes, title: 'Session Note' })
            });

            if (res.ok) {
                alert('Qayd saqlandi.');
            }
        } catch (err) {
            console.error(err);
        }
    };



    if (!lkToken) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#0f1117] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium animate-pulse">LiveKit xonasiga ulanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={lkToken}
            serverUrl={lkWsUrl}
            video={false}
            audio={false}
            connect={true}
            data-lk-theme="default"
            style={{ height: '100%' }}
        >
            <DashboardContent
                user={user}
                sessionId={sessionId}
                socket={socket}
                onBack={onBack}
                {...{
                    activeTab, setActiveTab,
                    sessionNotes, setSessionNotes,
                    chatInput, setChatInput,
                    quizScore,
                    sessionTime,
                    participantCount, setParticipantCount,
                    materials, setMaterials,
                    isUploading, setIsUploading,
                    fileInputRef,
                    quizzes, setQuizzes,
                    activeQuiz, setActiveQuiz,
                    quizResults, setQuizResults,
                    isCreatingQuiz, setIsCreatingQuiz,
                    newQuizTitle, setNewQuizTitle,
                    newQuestions, setNewQuestions,
                    bookings, setBookings,
                    isLoadingBookings, setIsLoadingBookings,
                    chatMessages, setChatMessages,
                    isMicOn, setIsMicOn,
                    isCamOn, setIsCamOn,
                    isScreenSharing, setIsScreenSharing,
                    isRecording, setIsRecording,
                    isSettingsOpen, setIsSettingsOpen,
                    isBreakoutOpen, setIsBreakoutOpen,
                    attendees, setAttendees,
                    handleCreateQuiz,
                    handleBroadcastQuiz,
                    handleAcceptBooking,
                    handleRejectBooking,
                    handleFileUpload,
                    handleEndSession,
                    handleToggleMic,
                    handleToggleCam,
                    handleToggleScreenShare,
                    handleToggleRecording,
                    handleForceMuteStudent,
                    handleRemoveStudent,
                    handleStartBreakout,
                    handleSendMessage,
                    handleSaveNote,
                    groups, setGroups,
                    selectedGroupId, setSelectedGroupId,
                    showNewGroupPrompt, setShowNewGroupPrompt,
                    newGroupName, setNewGroupName,
                    newGroupTime, setNewGroupTime
                }}
            />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}

// Inner component to use LiveKit hooks
function DashboardContent({
    user, sessionId, socket, onBack,
    activeTab, setActiveTab,
    sessionNotes, setSessionNotes,
    chatInput, setChatInput,
    quizScore,
    sessionTime,
    participantCount, setParticipantCount,
    materials, setMaterials,
    isUploading, setIsUploading,
    fileInputRef,
    quizzes, setQuizzes,
    activeQuiz, setActiveQuiz,
    quizResults, setQuizResults,
    isCreatingQuiz, setIsCreatingQuiz,
    newQuizTitle, setNewQuizTitle,
    newQuestions, setNewQuestions,
    bookings, setBookings,
    isLoadingBookings, setIsLoadingBookings,
    chatMessages, setChatMessages,
    isMicOn, setIsMicOn,
    isCamOn, setIsCamOn,
    isScreenSharing, setIsScreenSharing,
    isRecording, setIsRecording,
    isSettingsOpen, setIsSettingsOpen,
    isBreakoutOpen, setIsBreakoutOpen,
    attendees, setAttendees,
    handleCreateQuiz,
    handleBroadcastQuiz,
    handleAcceptBooking,
    handleRejectBooking,
    handleFileUpload,
    handleEndSession,
    handleToggleMic,
    handleToggleCam,
    handleToggleScreenShare,
    handleToggleRecording,
    handleForceMuteStudent,
    handleRemoveStudent,
    handleStartBreakout,
    handleSendMessage,
    handleSaveNote,
    groups, setGroups,
    selectedGroupId, setSelectedGroupId,
    showNewGroupPrompt, setShowNewGroupPrompt,
    newGroupName, setNewGroupName,
    newGroupTime, setNewGroupTime
}: any) {
    const { localParticipant } = useLocalParticipant();
    const connectionState = useConnectionState();
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
    const remoteParticipants = tracks.filter(t => !t.participant.isLocal);
    const localVideoTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.Camera);

    // Auto-enable media once connected with a slight delay to ensure engine stability
    React.useEffect(() => {
        if (connectionState === ConnectionState.Connected) {
            const timer = setTimeout(() => {
                setIsMicOn(true);
                setIsCamOn(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [connectionState]);

    // Sync hardware state with UI state - Only when connected to avoid timeout/engine-not-ready
    React.useEffect(() => {
        if (localParticipant && connectionState === ConnectionState.Connected) {
            localParticipant.setMicrophoneEnabled(isMicOn).catch(err => {
                console.warn("Manual microphone sync failed:", err);
            });
        }
    }, [isMicOn, localParticipant, connectionState]);

    React.useEffect(() => {
        if (localParticipant && connectionState === ConnectionState.Connected) {
            localParticipant.setCameraEnabled(isCamOn).catch(err => {
                console.warn("Manual camera sync failed:", err);
            });
        }
    }, [isCamOn, localParticipant, connectionState]);

    React.useEffect(() => {
        if (localParticipant && connectionState === ConnectionState.Connected) {
            localParticipant.setScreenShareEnabled(isScreenSharing).catch(err => {
                console.warn("Manual screen sharing sync failed:", err);
                setIsScreenSharing(false);
            });
        }
    }, [isScreenSharing, localParticipant, connectionState]);

    const handleCopyInvite = () => {
        const link = `${window.location.origin}/messages?room=${sessionId}`;
        navigator.clipboard.writeText(link);
        alert("Taklif havolasi nusxalandi!");
    };

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
                    <button
                        onClick={handleCopyInvite}
                        className="flex items-center gap-2 px-4 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-semibold border border-indigo-500/20 transition-all"
                        title="Copy session link to invite students"
                    >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Invite
                    </button>

                    <button
                        onClick={handleEndSession}
                        className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold border border-white/10 transition-all"
                    >
                        End Session
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button className="flex items-center gap-2 px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all">
                        <VideoIcon className="w-4 h-4" />
                        AuteCam
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all"
                    >
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

                {/* ═══ GROUPS SIDEBAR ═══ */}
                <div className="w-[200px] shrink-0 flex flex-col bg-[#12141c] border-r border-white/5 overflow-y-auto no-scrollbar">
                    <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5 bg-[#161821]">
                        <span className="text-sm font-bold text-white tracking-wide">Guruhlar</span>
                        <button onClick={() => setShowNewGroupPrompt(!showNewGroupPrompt)} className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {showNewGroupPrompt && (
                        <div className="p-3 bg-[#1a1c24] border-b border-white/5 animate-slide-down">
                            <input type="text" placeholder="Guruh nomi..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full bg-[#0d0f14] text-xs text-white rounded-lg px-3 py-2 border border-white/10 mb-2 outline-none" />
                            <input type="time" value={newGroupTime} onChange={e => setNewGroupTime(e.target.value)} className="w-full bg-[#0d0f14] text-xs text-white rounded-lg px-3 py-2 border border-white/10 mb-2 outline-none" />
                            <button onClick={() => {
                                if (newGroupName && newGroupTime) {
                                    setGroups([...groups, { id: Date.now().toString(), name: newGroupName, time: newGroupTime }]);
                                    setNewGroupName('');
                                    setNewGroupTime('');
                                    setShowNewGroupPrompt(false);
                                }
                            }} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all">
                                Saqlash
                            </button>
                        </div>
                    )}

                    <div className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
                        {groups.map((g: any) => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroupId(g.id)}
                                className={`w-full flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${selectedGroupId === g.id ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                            >
                                <span className={`text-xs font-bold mb-1 ${selectedGroupId === g.id ? 'text-indigo-400' : 'text-slate-300'}`}>{g.name}</span>
                                <div className="flex items-center gap-1.5 opacity-80">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span className="text-[10px] text-slate-400 font-mono font-medium">{g.time}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

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

                    {/* Booking Requests (Pending Escrow) */}
                    <div className="px-3 mb-4">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Booking Requests</span>
                            {isLoadingBookings && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                        </div>
                        <div className="space-y-2">
                            {bookings.length === 0 ? (
                                <div className="text-[10px] text-slate-500 italic px-1">No pending bookings</div>
                            ) : (
                                bookings.map((booking: any, idx: number) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden shrink-0">
                                                {booking.student_avatar ? (
                                                    <img src={booking.student_avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-[10px] font-bold text-white">
                                                        {booking.student_name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] font-bold text-white truncate">{booking.student_name}</span>
                                                <span className="text-[9px] text-emerald-400 font-bold">{booking.amount} MALI Locked</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => handleAcceptBooking(booking)}
                                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black rounded-lg transition-colors"
                                            >
                                                ACCEPT
                                            </button>
                                            <button onClick={() => handleRejectBooking(booking.id)} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-slate-400 text-[9px] font-bold rounded-lg transition-colors">LATER</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
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
                                    {quizzes.length > 0 && quizzes.map((q: any, i: number) => (
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
                                    <button
                                        onClick={() => setIsBreakoutOpen(true)}
                                        className="mx-3 mb-1 py-2 text-[10px] font-black uppercase tracking-tighter text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all"
                                    >
                                        💎 Breakout Groups
                                    </button>
                                    <button onClick={() => setIsCreatingQuiz(true)} className="mx-3 mb-3 mt-1 py-1.5 text-xs font-semibold text-blue-400 border border-dashed border-blue-500/30 rounded-lg hover:bg-blue-500/10 text-center transition-colors">
                                        + Create New Quiz
                                    </button>
                                </>
                            )}

                            {/* Participant List */}
                            <div className="mx-3 mb-2">
                                {attendees.length > 0 && attendees.map((student: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 px-1 hover:bg-white/5 rounded-lg transition-colors group/item relative">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}&backgroundColor=1e293b`} alt={student.name} className="w-full h-full" />
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#161927]" />
                                            </div>
                                            <span className="text-xs font-medium text-white">{student.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button onClick={() => handleForceMuteStudent(student.id)} title="Mute Student" className="w-5 h-5 flex items-center justify-center rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"><Mic className="w-2.5 h-2.5" /></button>
                                            <button onClick={() => handleRemoveStudent(student.id)} title="Remove Student" className="w-5 h-5 flex items-center justify-center rounded bg-slate-500/10 text-slate-500 hover:text-white"><Plus className="w-2.5 h-2.5 rotate-45" /></button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-1 px-1 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-slate-500 text-[10px] font-bold">+{participantCount}</div>
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
                                materials.map((mat: any) => {
                                    const isVideo = mat.file_type?.includes('video');
                                    return (
                                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${mat.file_url}`} target="_blank" rel="noreferrer" key={mat.id} className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold text-slate-300">

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
                        <div className="flex flex-col flex-1 pb-2">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                {chatMessages.length === 0 ? (
                                    <div className="text-white/30 text-xs text-center mt-4">Xabarlar yo'q</div>
                                ) : (
                                    chatMessages.map((m: any, i: number) => (
                                        <div key={m.id || i} className="flex gap-2.5 text-sm animate-slide-up">
                                            <img
                                                src={m.avatar || m.sender_avatar ? (m.avatar || m.sender_avatar).includes('http') ? (m.avatar || m.sender_avatar) : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}${(m.avatar || m.sender_avatar).startsWith('/') ? '' : '/'}${m.avatar || m.sender_avatar}` : "https://i.pravatar.cc/150?img=5"}
                                                alt="avatar"
                                                className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white/10"
                                                onError={(e: any) => { e.target.src = "https://i.pravatar.cc/150?img=5" }}
                                            />
                                            <div>
                                                <p className="leading-snug bg-white/5 px-3 py-2 rounded-xl rounded-tl-sm border border-white/5">
                                                    <span className="font-bold text-white/80 mr-1.5">{m.sender || m.sender_name}:</span>
                                                    <span className="text-white/90 break-words">{m.text || m.message}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-3 bg-[#11131a] border-t border-white/5 mx-2 rounded-xl">
                                <form className="relative" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                                    <input
                                        type="text"
                                        placeholder="Xabar yozing..."
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        className="w-full bg-[#1c1f2b] rounded-xl py-2.5 px-4 pr-10 text-sm text-white placeholder-white/40 border border-white/5 outline-none focus:ring-1 ring-blue-500/50 transition-all shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSendMessage()}
                                        disabled={!chatInput.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-blue-400 disabled:opacity-50 disabled:hover:text-white/40 bg-transparent outline-none transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ CENTER PANEL (VIDEO) ═══ */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0d0f1a]">

                    {/* Shared Video Frame Component */}
                    <LiveVideoFrame isMentor={true} />


                    {/* Bottom control bar (Mirrored from User's preferred design) */}
                    <div className="h-[72px] shrink-0 flex items-center justify-between px-6 bg-[#1c1f2b] border-t border-white/5 relative z-10 w-full">
                        {/* Title Info */}
                        <div className="flex flex-col">
                            <h3 className="text-white font-bold text-sm">{user?.name || 'Tessa Walker'}</h3>
                            <p className="text-white/40 text-xs text-left">Siz Mentorsiz</p>
                        </div>

                        {/* Center Actions */}
                        <div className="flex items-center gap-3">
                            {/* Microphone Button */}
                            <button
                                onClick={handleToggleMic}
                                className={`flex items-center gap-2 h-11 px-4 rounded-xl transition-all font-semibold text-sm shadow-sm ${isMicOn ? 'bg-[#2a2d3e] text-white/90 hover:bg-[#32364a] border border-white/5' : 'bg-red-500 text-white hover:bg-red-600'}`}
                            >
                                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                <span>{isMicOn ? 'Microphone' : 'Muted'}</span>
                                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                            </button>

                            {/* Camera Button */}
                            <button
                                onClick={handleToggleCam}
                                className={`flex items-center gap-2 h-11 px-4 rounded-xl transition-all font-semibold text-sm shadow-sm ${isCamOn ? 'bg-[#2a2d3e] text-white/90 hover:bg-[#32364a] border border-white/5' : 'bg-[#2a2d3e] text-white/50 hover:bg-[#32364a] border border-white/5'}`}
                            >
                                {isCamOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                                <span>Camera</span>
                                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                            </button>

                            {/* Screen Share Button */}
                            <button
                                onClick={handleToggleScreenShare}
                                className={`flex items-center gap-2 h-11 px-5 rounded-xl transition-all font-bold text-sm shadow-md ${isScreenSharing ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-[#2a2d3e] text-white/90 hover:bg-[#32364a] border border-white/5'}`}
                            >
                                {isScreenSharing ? <MonitorUp className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                <span>{isScreenSharing ? 'Stop screen share' : 'Share Screen'}</span>
                            </button>

                            {/* Chat Button (Optional) */}
                            <button
                                onClick={() => setActiveTab('chat')}
                                className="flex items-center gap-2 h-11 px-4 rounded-xl transition-all font-semibold text-sm bg-[#2a2d3e] text-white/90 hover:bg-[#32364a] border border-white/5"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>Chat</span>
                            </button>

                            {/* Leave Button */}
                            <button
                                onClick={() => window.location.href = '/dashboard/specialist'}
                                className="flex items-center gap-2 h-11 px-5 rounded-xl transition-all font-bold text-sm bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Leave</span>
                            </button>
                        </div>

                        {/* Right Tools (Recording, Volume, Layout) */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToggleRecording}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-transparent text-white/50 hover:bg-white/5'}`}
                                title={isRecording ? 'Stop Recording' : 'Start Recording'}
                            >
                                <Circle className={`w-4 h-4 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                            </button>
                            <button className="w-11 h-11 rounded-full flex items-center justify-center transition-all bg-transparent text-white/50 hover:bg-white/5">
                                <Users className="w-4 h-4" />
                            </button>
                            <button className="w-11 h-11 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600 transition-colors">
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button className="w-11 h-11 rounded-full flex items-center justify-center transition-all bg-transparent text-white/50 hover:bg-white/5">
                                <Settings className="w-4 h-4" />
                            </button>
                            <button className="w-11 h-11 rounded-full flex items-center justify-center transition-all bg-transparent text-white/50 hover:bg-white/5">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
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
                                materials.map((mat: any) => {
                                    const isVideo = mat.file_type?.includes('video');
                                    return (
                                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${mat.file_url}`} target="_blank" rel="noreferrer" key={mat.id} className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group">

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
                        <button
                            onClick={handleSaveNote}
                            className="w-full mt-2 mb-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/10"
                        >
                            Save Note
                        </button>
                    </div>

                    {/* End Session bottom bar */}
                    <div className="mx-3 mb-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                            <Users className="w-3.5 h-3.5" />
                        </div>
                        <button
                            onClick={handleEndSession}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/20 transition-all"
                        >
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

                            {newQuestions.map((q: any, qIndex: number) => (
                                <div key={qIndex} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-white">Question {qIndex + 1}</span>
                                        {newQuestions.length > 1 && (
                                            <button onClick={() => setNewQuestions((prev: any[]) => prev.filter((_: any, i: number) => i !== qIndex))} className="text-red-400 text-xs">Remove</button>
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
                                        {q.options.map((opt: any, oIndex: number) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`q-${qIndex}-correct`}
                                                    checked={opt.isCorrect}
                                                    onChange={() => {
                                                        const arr = [...newQuestions];
                                                        // clear others
                                                        arr[qIndex].options.forEach((o: any) => o.isCorrect = false);
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
                                onClick={() => setNewQuestions((prev: any[]) => [...prev, { text: '', typeof: 'multiple_choice', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }])}
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
            {/* DASHBOARD MODALS (Settings, Breakout) */}
            {isBreakoutOpen && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-[#161927] border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-2">Breakout Groups</h2>
                        <p className="text-xs text-slate-400 mb-4">Talabalarni kichik guruhlarga avto-taqsimlash.</p>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {[2, 3, 4, 5, 8, 10].map(n => (
                                <button
                                    key={n}
                                    onClick={() => handleStartBreakout(n)}
                                    className="py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-blue-600 hover:border-blue-500 transition-all"
                                >
                                    {n} Guruh
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsBreakoutOpen(false)} className="w-full py-2.5 text-slate-400 text-xs font-bold hover:text-white transition-colors">Yopish</button>
                    </div>
                </div>
            )}

            {isSettingsOpen && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#161927] border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 rotate-45" /> Settings</h2>
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white">Video Quality</span>
                                <span className="text-[10px] text-blue-400 font-bold">1080p (HD)</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white">Noise Cancellation</span>
                                <div className="w-8 h-4 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" /></div>
                            </div>
                        </div>
                        <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all">Save Changes</button>
                    </div>
                </div>
            )}
        </div>
    );
}

