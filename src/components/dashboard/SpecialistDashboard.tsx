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
import RecordingPlaybackModal from './shared/RecordingPlaybackModal';
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
    PenTool,
    MonitorOff,
} from 'lucide-react';

interface SpecialistDashboardProps {
    user: any;
    sessionId?: string;
    socket?: any;
    onBack?: () => void;
}

export default function SpecialistDashboard({ user, sessionId, socket, onBack }: SpecialistDashboardProps) {
    const [activeTab, setActiveTab] = useState<'attendees' | 'materials' | 'chat' | 'history'>('attendees');
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
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState(sessionId || '');
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

    // History & Playback State
    const [pastSessions, setPastSessions] = useState<any[]>([]);
    const [playbackSession, setPlaybackSession] = useState<any>(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isLessonStarted, setIsLessonStarted] = useState(false);

    // Media State
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

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

        const fetchHistory = async () => {
            try {
                const res = await apiFetch(`/api/sessions/history`);
                if (res.ok) {
                    const data = await res.json();
                    setPastSessions(data);
                }
            } catch (err) {
                console.error("Failed to fetch session history", err);
            }
        };

        // Fetch Expert Groups
        const fetchGroups = async () => {
            if (!user?.id) return;
            try {
                const res = await apiFetch(`/api/chats/expert/${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGroups(data);
                    // If no valid sessionId was provided, default to the first group
                    if ((!sessionId || sessionId === 'demo-session-id') && data.length > 0) {
                        setSelectedGroupId(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch expert groups", err);
            }
        };

        fetchMaterials();
        fetchQuizzes();
        fetchBookings();
        fetchHistory();
        fetchGroups();

        // Fetch LiveKit Token
        const fetchLiveKitToken = async () => {
            if (!selectedGroupId || selectedGroupId === 'demo-session-id') {
                console.log("[SpecialistDashboard] Skipping LiveKit token fetch for invalid groupId:", selectedGroupId);
                return;
            }
            try {
                console.log(`[SpecialistDashboard] Fetching LiveKit token for room: ${selectedGroupId}`);
                const res = await apiFetch(`/api/livekit/token?room=${selectedGroupId}&username=${encodeURIComponent(user?.name || 'Mentor')}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("[SpecialistDashboard] LiveKit token received successfully");
                    setLkToken(data.token);
                    setLkWsUrl(data.wsUrl);
                } else {
                    console.error("[SpecialistDashboard] Failed to fetch LiveKit token. Status:", res.status);
                }
            } catch (err) {
                console.error("[SpecialistDashboard] Error fetching LiveKit token:", err);
            }
        };
        if (selectedGroupId) fetchLiveKitToken();

        // Socket Listeners
        if (socket && selectedGroupId) {
            socket.emit('session_join', { sessionId: selectedGroupId });

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

            const handleWhiteboardToggle = (isOpen: boolean) => {
                setIsWhiteboardOpen(isOpen);
            };

            socket.on('material_new', handleNewMaterial);
            socket.on('quiz_result_update', handleQuizResultUpdate);
            socket.on('new_notification', handleNewBooking);
            socket.on('session_chat:receive', handleNewChatMessage);
            socket.on('receive_message', handleNewChatMessage);
            socket.on('participant_joined', handleParticipantJoined);
            socket.on('participant_left', handleParticipantLeft);
            socket.on('whiteboard:toggle', handleWhiteboardToggle);
            return () => {
                socket.off('material_new', handleNewMaterial);
                socket.off('quiz_result_update', handleQuizResultUpdate);
                socket.off('new_notification', handleNewBooking);
                socket.off('session_chat:receive', handleNewChatMessage);
                socket.off('receive_message', handleNewChatMessage);
                socket.off('participant_joined', handleParticipantJoined);
                socket.off('participant_left', handleParticipantLeft);
                socket.off('whiteboard:toggle', handleWhiteboardToggle);
            };

        }

    }, [selectedGroupId, socket, user?.id]);

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

    const handleQuickPoll = () => {
        if (!socket || !selectedGroupId) return;
        const quickPoll = {
            id: `poll-${Date.now()}`,
            title: 'Tezkor So\'rov',
            isQuickPoll: true,
            questions: [
                {
                    text: 'Hozirgi mavzu tushunarlimi?',
                    typeof: 'multiple_choice',
                    options: [
                        { id: '1', text: 'Ha, tushunarli', isCorrect: true },
                        { id: '2', text: "Yo'q, tushunarsiz", isCorrect: false }
                    ]
                }
            ]
        };
        // Emit the quick poll to the room
        socket.emit('quiz_start', { sessionId: selectedGroupId, quizId: quickPoll.id, quizDetails: quickPoll });
        setActiveQuiz(quickPoll);
        setQuizResults({}); // reset scores for this new poll
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

    const handleToggleWhiteboard = () => {
        const newState = !isWhiteboardOpen;
        setIsWhiteboardOpen(newState);
        if (socket) socket.emit('whiteboard:toggle', { sessionId, isOpen: newState });
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
        if (socket) socket.emit('force_mute_student', { sessionId: selectedGroupId, studentId });
        alert(`Student (ID: ${studentId}) ovozi o'chirildi.`);
    };

    const handleRemoveStudent = (participantId: string) => {
        if (socket && selectedGroupId) {
            socket.emit('kick_student', { sessionId: selectedGroupId, participantId });
            setAttendees(prev => prev.filter(p => p.id !== participantId));
        }
    };

    const handleStartLesson = () => {
        if (socket && selectedGroupId) {
            socket.emit('lesson_start', {
                sessionId: selectedGroupId,
                mentorName: user?.name || 'Mentor'
            });
            setIsLessonStarted(true);
            window.alert("Dars boshlandi! Guruh chatiga bildirishnoma yuborildi.");
        }
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



    if (!lkToken || !lkWsUrl) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[rgba(var(--glass-rgb),0.8)] text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold animate-pulse text-slate-400">VIDEO XONASIGA ULANMOQDA...</p>
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
                    pastSessions, setPastSessions,
                    playbackSession, setPlaybackSession,
                    chatMessages, setChatMessages,
                    isMicOn, setIsMicOn,
                    isCamOn, setIsCamOn,
                    isScreenSharing, setIsScreenSharing,
                    isRecording, setIsRecording,
                    isWhiteboardOpen, setIsWhiteboardOpen,
                    isSettingsOpen, setIsSettingsOpen,
                    isBreakoutOpen, setIsBreakoutOpen,
                    attendees, setAttendees,
                    handleCreateQuiz,
                    handleBroadcastQuiz,
                    handleQuickPoll,
                    handleAcceptBooking,
                    handleRejectBooking,
                    handleFileUpload,
                    handleEndSession,
                    handleToggleMic,
                    handleToggleCam,
                    handleToggleScreenShare,
                    handleToggleWhiteboard,
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
                    newGroupTime, setNewGroupTime,
                    isLessonStarted, setIsLessonStarted, handleStartLesson
                }}
            />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}

// Inner component to use LiveKit hooks
function DashboardContent({
    user, sessionId, socket, onBack,
    isLessonStarted, setIsLessonStarted, handleStartLesson,
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
    isWhiteboardOpen, setIsWhiteboardOpen,
    isSettingsOpen, setIsSettingsOpen,
    isBreakoutOpen, setIsBreakoutOpen,
    pastSessions, setPastSessions,
    playbackSession, setPlaybackSession,
    attendees, setAttendees,
    handleCreateQuiz,
    handleBroadcastQuiz,
    handleQuickPoll,
    handleAcceptBooking,
    handleRejectBooking,
    handleFileUpload,
    handleEndSession,
    handleToggleMic,
    handleToggleCam,
    handleToggleScreenShare,
    handleToggleWhiteboard,
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

    // Override toggle handlers to directly call LiveKit API
    const handleLocalToggleMic = async () => {
        if (!localParticipant) return;
        const next = !isMicOn;
        try {
            await localParticipant.setMicrophoneEnabled(next);
            setIsMicOn(next);
        } catch (e) {
            console.error('Mic toggle failed:', e);
        }
    };

    const handleLocalToggleCam = async () => {
        if (!localParticipant) return;
        const next = !isCamOn;
        try {
            await localParticipant.setCameraEnabled(next);
            setIsCamOn(next);
        } catch (e) {
            console.error('Camera toggle failed:', e);
        }
    };

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
        <div className="flex flex-col h-full bg-[rgba(var(--glass-rgb),0.8)] text-slate-200 font-sans overflow-hidden">

            {/* ─── TOP NAVIGATION BAR ─── */}
            <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-[rgba(var(--glass-rgb),0.8)] border-b border-white/5 gap-3">
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
                        onClick={handleEndSession}
                        className="flex items-center gap-2 px-6 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black shadow-lg shadow-red-500/20 transition-all active:scale-95"
                    >
                        End Session
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
                <div className="w-72 shrink-0 flex flex-col bg-[rgba(var(--glass-rgb),0.8)] border-r border-white/5 overflow-hidden">

                    {/* Manage Session */}
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-white/5">
                        <span className="text-sm font-bold text-white uppercase tracking-widest opacity-80">Manage Session</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-white transition-colors" title="Settings">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>


                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                        {/* Tabs for extra tools */}
                        <div className="flex border-b border-white/5 mx-2 mb-3 mt-2 shrink-0">
                            {(['attendees', 'materials', 'history'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'text-white border-b-2 border-blue-500 bg-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>


                        {/* ATTENDEES tab */}
                        {activeTab === 'attendees' && (
                            <div className="flex flex-col flex-1 pb-4 animate-fade-in">
                                <div className="mx-3 mb-2 flex items-center justify-between px-1 border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Active Participants ({attendees.length})</span>
                                    </div>
                                </div>

                                {/* Attendees List */}
                                <div className="px-3 space-y-2 overflow-y-auto no-scrollbar flex-1 min-h-0">
                                    {attendees.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-20 border-2 border-dashed border-white/5 rounded-2xl mx-1">
                                            <Users className="w-8 h-8" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Talabalar darsga kirishini kutilmoqda...</span>
                                        </div>
                                    ) : (
                                        attendees.map((student: any, i: number) => (
                                            <div key={student.id || i} className="flex items-center justify-between py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group/item shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden border border-white/10 shadow-inner">
                                                            <img
                                                                src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}&backgroundColor=1e293b`}
                                                                alt={student.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#161927] shadow-sm" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-bold text-white truncate">{student.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                            <span className="text-[8px] text-green-400/70 font-bold uppercase tracking-widest">Darsda</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-all translate-x-2 group-hover/item:translate-x-0">
                                                    <button
                                                        onClick={() => handleForceMuteStudent(student.id)}
                                                        title="Ovozni o'chirish"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <MicOff className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveStudent(student.id)}
                                                        title="Darsdan chetlatish"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-colors"
                                                    >
                                                        <LogOut className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Quick Controls */}
                                <div className="mt-2 px-3 space-y-2 border-t border-white/5 pt-3">
                                    <button
                                        onClick={() => setIsBreakoutOpen(true)}
                                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/5 border border-purple-500/10 rounded-xl hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                        Breakout Rooms
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsCreatingQuiz(true)} className="flex-1 py-1.5 text-[10px] font-black uppercase text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/5 transition-all text-center">
                                            + Quiz
                                        </button>
                                        <button onClick={handleQuickPoll} className="flex-1 py-1.5 text-[10px] font-black uppercase text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/5 transition-all text-center">
                                            ⚡ Poll
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* MATERIALS tab */}
                        {activeTab === 'materials' && (
                            <div className="flex flex-col flex-1 pb-4 animate-fade-in overflow-hidden">
                                {/* Upload Action */}
                                <div className="px-3 mb-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full py-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                    >
                                        {isUploading ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                        {isUploading ? "Yuklanmoqda..." : "Material Yuklash"}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <p className="mt-2 text-[9px] text-slate-500 text-center font-medium italic">
                                        Yuklangan materiallar avtomatik guruh chatiga ulashiladi.
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-2">
                                    {materials.length === 0 ? (
                                        <div className="py-8 flex flex-col items-center justify-center gap-3 opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                                            <FileText className="w-8 h-8" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Materiallar yo'q</span>
                                        </div>
                                    ) : (
                                        materials.map((mat: any) => {
                                            const isVideo = mat.file_type?.includes('video');
                                            const isImage = mat.file_type?.includes('image');
                                            const isPdf = mat.file_type?.includes('pdf');

                                            return (
                                                <div key={mat.id} className="group relative bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all p-3 shadow-sm">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${isVideo ? 'bg-blue-500/20 text-blue-400' :
                                                            isImage ? 'bg-emerald-500/20 text-emerald-400' :
                                                                isPdf ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                                                            }`}>
                                                            {isVideo ? <VideoIcon className="w-5 h-5" /> :
                                                                isImage ? <Camera className="w-5 h-5" /> :
                                                                    <FileText className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[11px] font-bold text-white truncate mb-0.5">{mat.title}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-slate-500 font-bold uppercase">{mat.file_type?.split('/')[1] || 'FILE'}</span>
                                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                                <div className="flex items-center gap-1 text-blue-400">
                                                                    <Check className="w-2.5 h-2.5" />
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Shared in Chat</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${mat.file_url}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/20 text-slate-400 hover:text-white transition-all"
                                                        >
                                                            <Maximize2 className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}


                        {/* HISTORY tab */}
                        {activeTab === 'history' && (
                            <div className="flex-1 p-3 space-y-2 overflow-y-auto no-scrollbar">
                                <div className="text-xs font-bold text-slate-300 mb-2 px-1">Tugallangan Darslar</div>
                                {pastSessions.length === 0 ? (
                                    <div className="text-[10px] text-slate-500 italic px-1">Hech qanday dars tarixi yo'q</div>
                                ) : (
                                    pastSessions.map((session: any) => (
                                        <div key={session.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <h4 className="text-xs font-bold text-white truncate">{session.title || "Dars yozuvi"}</h4>
                                                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(session.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {session.recording_url && (
                                                <button
                                                    onClick={() => setPlaybackSession(session)}
                                                    className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <VideoIcon className="w-3 h-3" />
                                                    Yozuvni ko'rish
                                                </button>
                                            )}
                                            {!session.recording_url && (
                                                <div className="text-[9px] text-slate-500 italic flex items-center gap-1">
                                                    <MonitorOff className="w-3 h-3" /> Yozib olinmagan
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* COMPACT PERMANENT CHAT */}
                    <div className="h-[310px] shrink-0 flex flex-col border-t border-white/10 bg-black/40">
                        <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">In-Meeting Chat</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{chatMessages.length} Messages</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 gap-2">
                                    <MessageSquare className="w-10 h-10" />
                                    <span className="text-xs uppercase font-black tracking-tighter">Quiet session...</span>
                                </div>
                            ) : (
                                chatMessages.map((m: any, i: number) => {
                                    const senderName = m.sender_name || m.sender || "Foydalanuvchi";
                                    const senderAvatar = m.sender_avatar || m.avatar;

                                    return (
                                        <div key={m.id || i} className="flex gap-2.5 animate-slide-up group/msg">
                                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 border border-white/5">
                                                <img
                                                    src={senderAvatar ? (senderAvatar.includes('http') ? senderAvatar : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}${senderAvatar.startsWith('/') ? '' : '/'}${senderAvatar}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}&backgroundColor=1e293b`}
                                                    alt="avatar"
                                                    className="w-full h-full object-cover"
                                                    onError={(e: any) => { e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=User&backgroundColor=1e293b" }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <span className="text-[10px] font-black text-white/50 truncate uppercase tracking-tighter group-hover/msg:text-blue-400 transition-colors">{senderName}</span>
                                                </div>
                                                <p className="text-[11px] text-white/90 leading-snug break-words bg-white/5 px-2.5 py-1.5 rounded-xl rounded-tl-none border border-white/5 inline-block max-w-full">
                                                    {m.text || m.message || m.content}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="p-3 bg-black/40 border-t border-white/5">
                            <form className="relative flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    className="flex-1 bg-white/5 rounded-xl py-2 px-3.5 text-[11px] text-white placeholder-white/20 border border-white/10 outline-none focus:border-blue-500/50 transition-all font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="p-2 aspect-square rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 transition-all shadow-lg shadow-blue-500/20 active:scale-90"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ═══ CENTER PANEL (VIDEO) ═══ */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0d0f1a]">

                    {/* Shared Video Frame Component */}
                    <LiveVideoFrame
                        isMentor={true}
                        isWhiteboardOpen={isWhiteboardOpen}
                        socket={socket}
                        sessionId={sessionId}
                        onCloseWhiteboard={handleToggleWhiteboard}
                    />

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
                                onClick={handleLocalToggleMic}
                                className={`flex items-center gap-2 h-11 px-4 rounded-xl transition-all font-semibold text-sm shadow-sm ${isMicOn ? 'bg-[#2a2d3e] text-white/90 hover:bg-[#32364a] border border-white/5' : 'bg-red-500 text-white hover:bg-red-600'}`}
                            >
                                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                <span>{isMicOn ? 'Microphone' : 'Muted'}</span>
                                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                            </button>

                            {/* Camera Button */}
                            <button
                                onClick={handleLocalToggleCam}
                                className={`flex items-center gap-2 h-11 px-4 rounded-xl transition-all font-semibold text-sm shadow-sm ${isCamOn ? 'bg-[#2a2d3e] text-white/90 hover:bg-[#32364a] border border-white/5' : 'bg-red-500/80 text-white hover:bg-red-600 border border-red-500/30'}`}
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
                                <Monitor className="w-4 h-4" />
                                <span className="hidden sm:inline">{isScreenSharing ? 'Stop' : 'Share'}</span>
                            </button>

                            {/* Whiteboard Button */}
                            <button
                                onClick={handleToggleWhiteboard}
                                className={`flex items-center gap-2 h-11 px-5 rounded-xl transition-all font-bold text-sm shadow-md ${isWhiteboardOpen ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-[#2a2d3e] text-white/90 hover:bg-[#32364a] border border-white/5'}`}
                            >
                                <PenTool className="w-4 h-4" />
                                <span className="hidden sm:inline">Whiteboard</span>
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
                    <div className="mx-3 mb-4 flex items-center justify-end gap-2">
                        <button
                            onClick={handleStartLesson}
                            disabled={isLessonStarted}
                            className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all ${isLessonStarted ? 'bg-blue-600/40 cursor-not-allowed border border-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 active:scale-95'}`}
                        >
                            {isLessonStarted ? 'Boshlandi' : 'Boshlash'}
                        </button>

                        <button className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 border border-white/10">
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

