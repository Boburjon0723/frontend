"use client";

import React, { useState, useRef } from 'react';
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
    User,
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
    Trash2,
} from 'lucide-react';

interface SpecialistDashboardProps {
    user: any;
    sessionId?: string;
    socket?: any;
    onBack?: () => void;
}

export default function SpecialistDashboard({ user, sessionId, socket, onBack }: SpecialistDashboardProps) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
    const getAvatarUrl = (path: string) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };
    const [activeTab, setActiveTab] = useState<'attendees' | 'materials' | 'history' | 'bookings'>('attendees');
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

    // Qo'l ko'tarish / Savolim bor — talaba signali
    const [handsRaised, setHandsRaised] = useState<Record<string, string>>({});

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
    const [isUploadingRecording, setIsUploadingRecording] = useState(false);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

    // Modal States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBreakoutOpen, setIsBreakoutOpen] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

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
                setGlobalError("Materiallarni yuklashda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.");
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
                setGlobalError("Guruhlar ro'yxatini yuklashda xatolik. Internet aloqangizni tekshiring.");
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
            const handleHandRaised = (data: { studentId: string; studentName: string }) => {
                setHandsRaised(prev => ({ ...prev, [data.studentId]: data.studentName }));
            };
            const handleHandLowered = (data: { studentId: string }) => {
                setHandsRaised(prev => {
                    const next = { ...prev };
                    delete next[data.studentId];
                    return next;
                });
            };

            socket.on('material_new', handleNewMaterial);
            socket.on('quiz_result_update', handleQuizResultUpdate);
            socket.on('new_notification', handleNewBooking);
            socket.on('session_chat:receive', handleNewChatMessage);
            socket.on('receive_message', handleNewChatMessage);
            socket.on('participant_joined', handleParticipantJoined);
            socket.on('participant_left', handleParticipantLeft);
            socket.on('whiteboard:toggle', handleWhiteboardToggle);
            socket.on('hand_raised', handleHandRaised);
            socket.on('hand_lowered', handleHandLowered);
            return () => {
                socket.off('material_new', handleNewMaterial);
                socket.off('quiz_result_update', handleQuizResultUpdate);
                socket.off('new_notification', handleNewBooking);
                socket.off('session_chat:receive', handleNewChatMessage);
                socket.off('receive_message', handleNewChatMessage);
                socket.off('participant_joined', handleParticipantJoined);
                socket.off('participant_left', handleParticipantLeft);
                socket.off('whiteboard:toggle', handleWhiteboardToggle);
                socket.off('hand_raised', handleHandRaised);
                socket.off('hand_lowered', handleHandLowered);
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

    const handleDeleteQuiz = (quizId: string | number) => {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
    };

    const handleBroadcastQuiz = (quiz: any) => {
        if (!socket || !selectedGroupId) return;
        const quizDetails = {
            ...quiz,
            questions: (quiz.questions || []).map((q: any) => ({
                ...q,
                options: (q.options || []).map((o: any, oi: number) => ({ ...o, id: o.id ?? String(oi), text: o.text ?? o.label }))
            }))
        };
        socket.emit('quiz_start', { sessionId: selectedGroupId, quizId: quiz.id, quizDetails });
        setActiveQuiz(quizDetails);
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

    const handleRejectBooking = async (booking: any) => {
        const id = typeof booking === 'string' ? booking : booking?.id;
        if (!id) return;
        try {
            const res = await apiFetch(`/api/wallet/booking/reject`, {
                method: 'POST',
                body: JSON.stringify({ transactionId: id }),
            });
            if (res.ok) {
                setBookings((prev: any[]) => prev.filter(b => b.id !== id));
                alert('Yozilish rad etildi. MALI talabaga qaytarildi.');
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data?.message || 'Rad etish amalga oshmadi.');
            }
        } catch (err) {
            console.error(err);
            setBookings((prev: any[]) => prev.filter(b => b.id !== id));
            alert('Yozilish ro\'yxatdan olib tashlandi.');
        }
    };

    const handleCompletePayment = async (booking: any) => {
        if (!booking?.id) return;
        try {
            const res = await apiFetch(`/api/wallet/complete`, {
                method: 'POST',
                body: JSON.stringify({ transactionId: booking.id }),
            });
            if (res.ok) {
                setBookings((prev: any[]) => prev.filter(b => b.id !== booking.id));
                alert(`To'lov tasdiqlandi. ${booking.amount || ''} MALI hisobingizga o'tkazildi.`);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data?.message || 'To\'lov tasdiqlanmadi.');
            }
        } catch (err) {
            console.error(err);
            alert('To\'lov tasdiqlashda xatolik.');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGroupId) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('material', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app'}/api/sessions/${selectedGroupId}/materials`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });


            if (res.ok) {
                const newMaterial = await res.json();
                if (socket) {
                    socket.emit('material_uploaded', { sessionId: selectedGroupId, material: newMaterial });
                    const url = newMaterial.file_url?.startsWith('http') ? newMaterial.file_url : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app'}${newMaterial.file_url?.startsWith('/') ? '' : '/'}${newMaterial.file_url || ''}`;
                    socket.emit('send_message', { roomId: selectedGroupId, content: `📎 **${newMaterial.title || 'Material'}**\n${url}`, type: 'text' });
                }
                setMaterials(prev => [newMaterial, ...prev]);
            } else {
                alert('Material yuklash muvaffaqiyatsiz');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Yuklashda xatolik');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEndSession = async () => {
        if (!window.confirm('Darsni yakunlashni xohlaysizmi? MALI kafillikdan yechiladi.')) return;
        try {
            const chatId = selectedGroupId;
            if (socket && chatId) {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
                const postToChat = (content: string, type = 'text') => {
                    socket.emit('send_message', { roomId: chatId, content, type });
                };
                if (quizzes.length > 0 || materials.length > 0) {
                    postToChat('📋 **Dars yakunlandi.** Quyida viktorinalar va materiallar — talabalar qayta ko\'rishi mumkin.');
                }
                quizzes.forEach((q: any) => {
                    const lines = [`📌 **${q.title || 'Viktorina'}**`];
                    (q.questions || []).forEach((qq: any, i: number) => {
                        lines.push(`${i + 1}. ${qq.text || ''}`);
                        (qq.options || []).forEach((o: any, j: number) => {
                            lines.push(`   ${String.fromCharCode(65 + j)}. ${o.text || ''}${o.isCorrect ? ' ✓' : ''}`);
                        });
                    });
                    postToChat(lines.join('\n'));
                });
                materials.forEach((m: any) => {
                    const url = m.file_url?.startsWith('http') ? m.file_url : `${API_BASE}${m.file_url?.startsWith('/') ? '' : '/'}${m.file_url || ''}`;
                    postToChat(`📎 **${m.title || 'Material'}**\n${url}`);
                });
            }
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

    const MAX_RECORDING_MB = 48;
    // Yuqori sifat: 48 kHz, echo/noise sozlamalari, 128 kbps Opus (kelajakda video uchun ham konfig qo'shish mumkin)
    const AUDIO_RECORDING_OPTIONS = {
        audioBitsPerSecond: 128000 as number, // 128 kbps – yaxshi ovoz sifati
        mimeType: (() => {
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
            if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
            return 'audio/mp4';
        })(),
    };

    const handleToggleRecording = async () => {
        const roomId = selectedGroupId || sessionId;
        if (!roomId) return;

        if (!isRecording) {
            try {
                let stream: MediaStream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            sampleRate: 48000,
                            channelCount: 1,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                        video: false,
                    });
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                }
                recordingStreamRef.current = stream;
                recordedChunksRef.current = [];
                const mimeType = AUDIO_RECORDING_OPTIONS.mimeType;
                const options: MediaRecorderOptions = {
                    audioBitsPerSecond: AUDIO_RECORDING_OPTIONS.audioBitsPerSecond,
                    mimeType: mimeType.startsWith('audio/') ? mimeType : undefined,
                };
                const recorder = new MediaRecorder(stream, options);
                mediaRecorderRef.current = recorder;
                recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
                recorder.onstop = async () => {
                    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
                    recordingStreamRef.current = null;
                    if (blob.size > MAX_RECORDING_MB * 1024 * 1024) {
                        alert(`Yozuv ${MAX_RECORDING_MB} MB dan oshdi (Supabase 50 MB limit). Qisqaroq yozing yoki faqat ovozni yozing.`);
                        setIsRecording(false);
                        return;
                    }
                    setIsUploadingRecording(true);
                    try {
                        const formData = new FormData();
                        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
                        formData.append('files', blob, `dars-${roomId}-${Date.now()}.${ext}`);
                        const token = localStorage.getItem('token');
                        const uploadRes = await fetch(`${API_URL}/api/media/upload?recording=1`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData,
                        });
                        if (!uploadRes.ok) {
                            const err = await uploadRes.json().catch(() => ({}));
                            throw new Error(err?.error || 'Yuklash muvaffaqiyatsiz');
                        }
                        const uploadData = await uploadRes.json();
                        const recordingUrl = uploadData?.urls?.[0] || uploadData?.files?.[0]?.url || uploadData?.url;
                        if (!recordingUrl) throw new Error('URL olinmadi');
                        await apiFetch(`/api/sessions/${roomId}/recording-done`, {
                            method: 'POST',
                            body: JSON.stringify({ recordingUrl }),
                        });
                        alert('Dars yozuvi guruhga yuborildi.');
                    } catch (e: any) {
                        console.error(e);
                        alert(e?.message || 'Yozuvni yuklashda xatolik.');
                    } finally {
                        setIsUploadingRecording(false);
                        setIsRecording(false);
                    }
                };
                recorder.start(10000);
                setIsRecording(true);
                await apiFetch(`/api/sessions/${roomId}/record/start`, { method: 'POST' });
            } catch (e: any) {
                console.error(e);
                alert('Mikrofon ruxsati yoki yozuv boshlamoqda xatolik: ' + (e?.message || ''));
            }
        } else {
            const rec = mediaRecorderRef.current;
            if (rec && rec.state !== 'inactive') {
                rec.stop();
            } else {
                setIsRecording(false);
            }
            await apiFetch(`/api/sessions/${roomId}/record/stop`, { method: 'POST' }).catch(() => {});
        }
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
        if (!sessionNotes.trim() || !selectedGroupId) return;
        try {
            const res = await apiFetch(`/api/specialists/notes`, {
                method: 'POST',
                body: JSON.stringify({
                    content: sessionNotes,
                    chat_id: selectedGroupId,
                    session_id: selectedGroupId,
                    shared_with_client: true
                })
            });

            if (res.ok) {
                alert('Qayd saqlandi va guruh chatiga yuborildi.');
                setSessionNotes('');
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data?.message || 'Qayd saqlanmadi.');
            }
        } catch (err) {
            console.error(err);
            alert('Qayd saqlashda xatolik.');
        }
    };



    if (globalError) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[rgba(var(--glass-rgb),0.8)] text-white px-6 text-center">
                <div className="space-y-3 max-w-md">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold">Sessiyani yuklashda xatolik</p>
                    <p className="text-xs text-slate-200/80">{globalError}</p>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mt-2 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                        >
                            Orqaga qaytish
                        </button>
                    )}
                </div>
            </div>
        );
    }

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
                    handsRaised, setHandsRaised,
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
                    isUploadingRecording,
                    isWhiteboardOpen, setIsWhiteboardOpen,
                    isSettingsOpen, setIsSettingsOpen,
                    isBreakoutOpen, setIsBreakoutOpen,
                    attendees, setAttendees,
                    handleCreateQuiz,
                    handleBroadcastQuiz,
                    handleDeleteQuiz,
                    handleQuickPoll,
                    handleAcceptBooking,
                    handleRejectBooking,
                    handleCompletePayment,
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
                    isLessonStarted, setIsLessonStarted, handleStartLesson,
                    getAvatarUrl
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
    handsRaised, setHandsRaised,
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
    isUploadingRecording,
    isWhiteboardOpen, setIsWhiteboardOpen,
    isSettingsOpen, setIsSettingsOpen,
    isBreakoutOpen, setIsBreakoutOpen,
    pastSessions, setPastSessions,
    playbackSession, setPlaybackSession,
    attendees, setAttendees,
    handleCreateQuiz,
    handleBroadcastQuiz,
    handleDeleteQuiz,
    handleQuickPoll,
    handleAcceptBooking,
    handleRejectBooking,
    handleCompletePayment,
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
    getAvatarUrl
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
        <div className="mentor-dashboard relative flex flex-col h-full min-h-0 text-slate-200 font-sans overflow-hidden bg-gradient-to-br from-slate-900 via-[#141824] to-indigo-950/40">
            {/* Yengil grid texture — fonni yumshoq qiladi */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

            {/* ─── TOP NAVIGATION BAR ─── */}
            <div className="relative h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 gap-3">
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
                        {getAvatarUrl(user?.avatar_url || user?.avatar) ? (
                            <img src={getAvatarUrl(user?.avatar_url || user?.avatar)!} alt="Mentor" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                {user?.name?.[0] || 'M'}
                            </div>
                        )}
                        <span className="text-sm font-bold text-white">Ustoz paneli</span>
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
                        YOZUV
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
                        Darsni tugatish
                    </button>

                    {getAvatarUrl(user?.avatar_url || user?.avatar) ? (
                        <img src={getAvatarUrl(user?.avatar_url || user?.avatar)!} alt="User" className="w-9 h-9 rounded-full object-cover" />
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
                <div className="relative w-72 shrink-0 flex flex-col bg-slate-900/50 backdrop-blur-xl border-r border-white/5 overflow-hidden shadow-2xl shadow-black/20">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                    {/* Manage Session */}
                    <div className="relative px-4 pt-4 pb-2 flex items-center justify-between border-b border-white/5">
                        <span className="text-sm font-bold text-white uppercase tracking-widest opacity-80">Sessiyani boshqarish</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-white transition-colors" title="Sozlamalar">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>


                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                        {/* Tabs for extra tools */}
                        <div className="flex border-b border-white/5 mx-2 mb-3 mt-2 shrink-0">
                            {(['attendees', 'materials', 'history', 'bookings'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'text-white border-b-2 border-blue-500 bg-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                >
                                    {tab === 'bookings' ? 'Yozilish' : tab}
                                </button>
                            ))}
                        </div>


                        {/* BOOKINGS tab */}
                        {activeTab === 'bookings' && (
                            <div className="flex flex-col flex-1 pb-4 animate-fade-in overflow-hidden">
                                <div className="mx-3 mb-2 px-1 border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Darsga yozilishlar</span>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-2">
                                    {isLoadingBookings ? (
                                        <div className="py-4 flex justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
                                    ) : bookings.length === 0 ? (
                                        <div className="py-6 text-center text-slate-500 text-xs">Yozilishlar yo&apos;q</div>
                                    ) : (
                                        bookings.map((b: any) => (
                                            <div key={b.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                                <div className="flex items-center gap-2">
                                                    {getAvatarUrl(b.student_avatar) ? (
                                                        <img src={getAvatarUrl(b.student_avatar)!} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">{b.student_name?.[0] || '?'}</div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white truncate">{b.student_name || 'Talaba'}</p>
                                                        <p className="text-[10px] text-emerald-400 font-semibold">{parseFloat(b.amount || 0).toLocaleString()} MALI</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <button onClick={() => handleAcceptBooking(b)} className="flex-1 min-w-0 py-1.5 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold">Qabul</button>
                                                    <button onClick={() => handleCompletePayment(b)} className="flex-1 min-w-0 py-1.5 px-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-[10px] font-bold">To&apos;lov</button>
                                                    <button onClick={() => handleRejectBooking(b)} className="py-1.5 px-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] font-bold">Rad etish</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ATTENDEES tab */}
                        {activeTab === 'attendees' && (
                            <div className="flex flex-col flex-1 pb-4 animate-fade-in">
                                {Object.keys(handsRaised || {}).length > 0 && (
                                    <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2">
                                        <span className="text-amber-400 text-lg">✋</span>
                                        <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">
                                            {Object.keys(handsRaised || {}).length} ta talaba savol bermoqda
                                        </span>
                                    </div>
                                )}
                                <div className="mx-3 mb-2 flex items-center justify-between px-1 border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Qatnashchilar ({attendees.length})</span>
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
                                            <div key={student.id || i} className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-all group/item shadow-sm ${(handsRaised || {})[student.id] ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden border border-white/10 shadow-inner">
                                                            <img
                                                                src={getAvatarUrl(student.avatar_url || student.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}&backgroundColor=1e293b`}
                                                                alt={student.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#161927] shadow-sm" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-bold text-white truncate">{student.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            {(handsRaised || {})[student.id] ? (
                                                                <span className="text-[8px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                    <span>✋</span> Savol bor
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                                    <span className="text-[8px] text-green-400/70 font-bold uppercase tracking-widest">Darsda</span>
                                                                </>
                                                            )}
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
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Chatda ulashilgan</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app'}${mat.file_url.startsWith('/') ? '' : '/'}${mat.file_url}`}
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
                                                    src={getAvatarUrl(senderAvatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}&backgroundColor=1e293b`}
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
                        handsRaised={handsRaised}
                    />

                    {/* Bottom control bar (Mirrored from User's preferred design) */}
                    <div className="h-[72px] shrink-0 flex items-center justify-between px-6 bg-[#1c1f2b] border-t border-white/5 relative z-10 w-full">
                        {/* Title Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                                {getAvatarUrl(user?.avatar_url || user?.avatar) ? (
                                    <img src={getAvatarUrl(user?.avatar_url || user?.avatar)!} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-white/40" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-white font-bold text-sm">{user?.name || 'Tessa Walker'}</h3>
                                <p className="text-white/40 text-xs text-left">Siz Mentorsiz</p>
                            </div>
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
                                <span className="hidden sm:inline">{isScreenSharing ? 'To\'xtatish' : 'Ulashish'}</span>
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
                                disabled={isUploadingRecording}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-transparent text-white/50 hover:bg-white/5'} ${isUploadingRecording ? 'opacity-70' : ''}`}
                                title={isUploadingRecording ? 'Yuklanmoqda...' : isRecording ? 'To\'xtatish' : 'Yozuvni boshlash'}
                            >
                                {isUploadingRecording ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Circle className={`w-4 h-4 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                                )}
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
                <div className="relative w-64 shrink-0 flex flex-col bg-slate-900/60 backdrop-blur-xl border-l border-white/5 overflow-y-auto no-scrollbar shadow-2xl shadow-black/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />

                    {/* Materiallar va viktorinalar */}
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Materiallar va viktorinalar</span>
                        <button className="text-slate-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>

                    {/* Yuklash / Viktorina yaratish */}
                    <div className="px-3 mb-3 flex gap-2">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || !sessionId}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-semibold text-slate-300 border border-white/10 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Plus className="w-3 h-3" /> {isUploading ? 'Yuklanmoqda...' : 'Material yuklash'}
                        </button>
                        <button
                            onClick={() => setIsCreatingQuiz(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-semibold text-slate-300 border border-white/10"
                        >
                            <Plus className="w-3 h-3" /> Viktorina yaratish
                        </button>
                    </div>

                    {/* Quiz yakunlangan badge */}
                    {activeQuiz && (
                        <div className="mx-3 mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">{activeQuiz.title}</div>
                                <div className="text-[10px] text-green-400">{Object.keys(quizResults).length} ta talaba javob berdi</div>
                            </div>
                        </div>
                    )}

                    {/* Kim qancha topgani */}
                    {activeQuiz && Object.keys(quizResults).length > 0 && (
                        <div className="px-3 mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400">Kim qancha topgani</span>
                            </div>
                            <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar">
                                {Object.entries(quizResults)
                                    .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
                                    .map(([studentId, score], idx) => {
                                        const att = attendees.find((a: any) => a.id === studentId);
                                        const name = att?.name || att?.username || `Talaba ${String(studentId).slice(0, 6)}`;
                                        return (
                                            <div key={studentId} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/5 text-xs">
                                                <span className="text-slate-300 font-medium truncate flex-1">{idx + 1}. {name}</span>
                                                <span className="text-emerald-400 font-bold shrink-0 ml-2">{Number(score) || 0} ball</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Kurs materiallari */}
                    <div className="px-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400">Kurs materiallari</span>
                            <button className="text-slate-600 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1.5">
                            {materials.length === 0 ? (
                                <div className="text-xs text-slate-500 italic py-2">Material yo&apos;q</div>
                            ) : (
                                materials.map((mat: any) => {
                                    const isVideo = mat.file_type?.includes('video');
                                    return (
                                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app'}${mat.file_url.startsWith('/') ? '' : '/'}${mat.file_url}`} target="_blank" rel="noreferrer" key={mat.id} className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group">

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

                    {/* Saqlangan savollar — panelda ko'rinadi, Jo'natish va O'chirish */}
                    {quizzes.length > 0 && (
                        <div className="px-3 mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400">Saqlangan savollar</span>
                            </div>
                            <div className="space-y-1.5">
                                {quizzes.map((q: any) => (
                                    <div key={q.id} className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 group">
                                        <span className="text-xs font-medium text-slate-300 truncate flex-1 min-w-0">{q.title}</span>
                                        <button
                                            onClick={() => handleBroadcastQuiz(q)}
                                            className="shrink-0 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all"
                                        >
                                            Jo&apos;natish
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuiz(q.id)}
                                            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="O'chirish"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mx-3 h-px bg-white/5 mb-3" />

                    {/* Tezkor so'rov — bir bosishda barcha talabaga "Tushunarlimi?" yuborish */}
                    <div className="px-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400">Tezkor so'rov</span>
                        </div>
                        <button
                            onClick={handleQuickPoll}
                            disabled={!selectedGroupId || !socket}
                            className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-xs font-medium text-slate-200 group-hover:text-white">Mavzu tushunarlimi?</span>
                        </button>
                        <p className="text-[10px] text-slate-500 mt-1.5 px-0.5">Barcha talabaga Ha/Yoʻq soʻrovi darhol yuboriladi.</p>
                    </div>

                    <div className="mx-3 h-px bg-white/5 mb-3" />

                    {/* Sessiya qaydlari */}
                    <div className="px-3 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400">Sessiya qaydlari</span>
                            <button className="text-slate-600 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                        <textarea
                            value={sessionNotes}
                            onChange={e => setSessionNotes(e.target.value)}
                            placeholder="Sessiya qaydlarini shu yerga yozing..."
                            className="w-full h-32 bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-white/20 transition-colors placeholder:text-slate-600"
                        />
                        <button
                            onClick={handleSaveNote}
                            className="w-full mt-2 mb-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/10"
                        >
                            Qaydni saqlash
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

            {/* Viktorina yaratish modali */}
            {isCreatingQuiz && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#161927] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                        <h2 className="text-lg font-bold text-white mb-4">Viktorina yaratish</h2>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                            <div>
                                <label className="text-xs text-slate-400 font-bold mb-1 block">Viktorina sarlavhasi</label>
                                <input
                                    type="text"
                                    value={newQuizTitle}
                                    onChange={e => setNewQuizTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Masalan: Dars ortidagi bilim tekshiruvi"
                                />
                            </div>

                            {newQuestions.map((q: any, qIndex: number) => (
                                <div key={qIndex} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-white">Savol {qIndex + 1}</span>
                                        {newQuestions.length > 1 && (
                                            <button onClick={() => setNewQuestions((prev: any[]) => prev.filter((_: any, i: number) => i !== qIndex))} className="text-red-400 text-xs">O&apos;chirish</button>
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
                                        placeholder="Savol matni..."
                                    />

                                    <div className="space-y-1.5 pl-2 border-l border-white/10 mt-3">
                                        <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Variantlar (to&apos;g&apos;risini belgilang)</span>
                                        {q.options.map((opt: any, oIndex: number) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`q-${qIndex}-correct`}
                                                    checked={opt.isCorrect}
                                                    onChange={() => {
                                                        const arr = [...newQuestions];
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
                                                    placeholder="Variant matni..."
                                                />
                                                {q.options.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const arr = [...newQuestions];
                                                            const opts = arr[qIndex].options.filter((_: any, i: number) => i !== oIndex);
                                                            if (opts.some((o: any) => o.isCorrect)) {
                                                                arr[qIndex].options = opts;
                                                            } else {
                                                                opts[0].isCorrect = true;
                                                                arr[qIndex].options = opts;
                                                            }
                                                            setNewQuestions(arr);
                                                        }}
                                                        className="text-red-400 hover:text-red-300 text-xs shrink-0"
                                                        title="Variantni o'chirish"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const arr = [...newQuestions];
                                                arr[qIndex].options = [...(arr[qIndex].options || []), { text: '', isCorrect: false }];
                                                setNewQuestions(arr);
                                            }}
                                            className="mt-1.5 text-xs text-slate-400 hover:text-white border border-dashed border-white/20 rounded-lg px-2 py-1"
                                        >
                                            + Yana variant qo&apos;shish
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setNewQuestions((prev: any[]) => [...prev, { text: '', typeof: 'multiple_choice', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }])}
                                className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs text-slate-400 hover:text-white hover:border-white/40 transiton-all"
                            >
                                + Yana savol qo&apos;shish
                            </button>
                        </div>

                        <div className="pt-4 mt-2 border-t border-white/10 flex gap-2">
                            <button onClick={() => setIsCreatingQuiz(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10">Bekor qilish</button>
                            <button onClick={handleCreateQuiz} disabled={!newQuizTitle} className={`flex-1 py-2 rounded-xl text-white text-xs font-bold ${newQuizTitle ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 cursor-not-allowed'}`}>Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
            {/* DASHBOARD MODALS (Settings, Breakout) */}
            {isBreakoutOpen && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-[#161927] border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-2">Kichik guruhlar</h2>
                        <p className="text-xs text-slate-400 mb-4">Talabalarni kichik guruhlarga avto-taqsimlash.</p>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {[2, 3, 4, 5, 8, 10].map(n => (
                                <button
                                    key={n}
                                    onClick={() => handleStartBreakout(n)}
                                    className="py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-blue-600 hover:border-blue-500 transition-all"
                                >
                                    {n} guruh
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
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 rotate-45" /> Sozlamalar</h2>
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white">Video sifati</span>
                                <span className="text-[10px] text-blue-400 font-bold">1080p (HD)</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white">Shovqinni kamaytirish</span>
                                <div className="w-8 h-4 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" /></div>
                            </div>
                        </div>
                        <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all">Saqlash</button>
                    </div>
                </div>
            )}
        </div>
    );
}

