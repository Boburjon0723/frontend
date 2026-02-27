import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { MessageBubble } from './MessageBubble';
import SendCoinModal from './SendCoinModal';
import MediaPreviewModal from './MediaPreviewModal';
import { useSocket } from '@/context/SocketContext'; // Import socket hook
import { apiFetch } from '@/lib/api';

// Mock Messages (Initial State)
const INITIAL_MESSAGES: any[] = [];

interface ChatWindowProps {
    chat?: any;
    onToggleInfo?: () => void;
    onBack?: () => void;
    onMarkAsRead?: (chatId: string) => void;
}

export default function ChatWindow({ chat, onToggleInfo, onBack, onMarkAsRead }: ChatWindowProps) {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<any[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [debugError, setDebugError] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<any | null>(null);
    const [showSendCoinModal, setShowSendCoinModal] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [tradeData, setTradeData] = useState<any>(null);
    const [isContact, setIsContact] = useState<boolean>(true);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [blockStatus, setBlockStatus] = useState<{ isBlocked: boolean, blockedByMe: boolean }>({ isBlocked: false, blockedByMe: false });

    // Media & Advanced Feature States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [mediaPreviewFile, setMediaPreviewFile] = useState<File | null>(null);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    // Search & Calling
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [callData, setCallData] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [callTimer, setCallTimer] = useState(0);
    const callIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [callType, setCallType] = useState<'audio' | 'video'>('audio');
    const [showScrollButton, setShowScrollButton] = useState(false);

    // WebRTC Real-time Video
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [uploadProgresses, setUploadProgresses] = useState<Record<string, number>>({});
    const [isDragging, setIsDragging] = useState(false);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // Selection Mode
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

    const toggleSelection = (msgId: string) => {
        setSelectedMessageIds(prev =>
            prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
        );
    };

    const handleDeleteSelected = async () => {
        if (!chat || selectedMessageIds.length === 0) return;
        if (!confirm("Tanlangan xabarlarni o'chirmoqchimisiz?")) return;
        try {
            const res = await apiFetch(`/api/chats/${chat.id}/messages/bulk`, {
                method: 'DELETE',
                body: JSON.stringify({ messageIds: selectedMessageIds })
            });
            if (res.ok) {
                setMessages(prev => prev.filter(m => !selectedMessageIds.includes(m.id)));
                setIsSelecting(false);
                setSelectedMessageIds([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleClearHistory = async () => {
        if (!chat) return;
        if (!confirm("Chat tarixini butunlay tozalamoqchimisiz?")) return;
        try {
            const res = await apiFetch(`/api/chats/${chat.id}/messages`, { method: 'DELETE' });
            if (res.ok) {
                setMessages([]);
                setShowMoreMenu(false);
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteChat = async () => {
        if (!chat) return;
        if (!confirm("Chatni butunlay o'chirmoqchimisiz?")) return;
        try {
            const res = await apiFetch(`/api/chats/${chat.id}`, { method: 'DELETE' });
            if (res.ok) {
                if (onBack) onBack();
                else window.location.reload();
            }
        } catch (e) { console.error(e); }
    };

    const handleExportHistory = () => {
        if (messages.length === 0) return alert("Eksport qilish uchun xabarlar yo'q");
        const textContent = messages.map(m => `[${m.time}] ${m.sender === 'me' ? 'Siz' : 'Suhbatdosh'}: ${m.type === 'text' ? m.text : `[${m.type} - ${m.text}]`}`).join('\n');
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `chat_history_${chat.id.substring(0, 8)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setShowMoreMenu(false);
    };

    const fetchTradeDetails = useCallback(async () => {
        if (!chat || !chat.isTrade || !chat.tradeId) return;
        try {
            const res = await apiFetch(`/api/p2p/trade/${chat.tradeId}`);
            if (res.ok) {
                const data = await res.json();
                setTradeData(data);
            }
        } catch (e) { console.error(e); }
    }, [chat?.tradeId, chat?.isTrade]);

    const fetchActiveSession = useCallback(async () => {
        if (!chat || !chat.id) return;
        try {
            const res = await apiFetch(`/api/p2p/trades`);
            if (res.ok) {
                const sessions = await res.json();
                const current = sessions.find((s: any) => s.chat_id === chat.id && (s.status === 'initiated' || s.status === 'ongoing'));
                setActiveSession(current || null);
            }
        } catch (e) { console.error(e); }
    }, [chat?.id]);

    const checkIfContact = useCallback(async () => {
        if (!chat || chat.type !== 'private' || chat.isTrade) {
            setIsContact(true);
            return;
        }

        try {
            const res = await apiFetch(`/api/users/contacts`);
            if (res.ok) {
                const contacts = await res.json();
                const targetId = chat.otherUser?.id || chat.userId || chat.id;
                const found = contacts.find((c: any) => String(c.id || c.userId) === String(targetId));
                setIsContact(!!found);
            }
        } catch (e) { console.error("Contact check error:", e); }
    }, [chat?.id, chat?.type, chat?.isTrade, chat?.userId, chat?.otherUser?.id]);

    const handleAddContact = async () => {
        if (!chat) return;
        setIsAddingContact(true);
        const targetId = chat.otherUser?.id || chat.userId || chat.id;
        try {
            const res = await apiFetch(`/api/users/contacts`, {
                method: 'POST',
                body: JSON.stringify({
                    contactUserId: targetId,
                    name: chat.name || chat.otherUser?.name || 'User',
                    surname: chat.otherUser?.surname || ''
                })
            });
            if (res.ok) {
                setIsContact(true);
                window.dispatchEvent(new Event('contacts_updated'));
            }
        } catch (e) { console.error(e); }
        finally { setIsAddingContact(false); }
    };

    const fetchBlockStatus = useCallback(async () => {
        if (!chat || chat.type !== 'private') return;
        try {
            const token = localStorage.getItem('token');
            const targetId = chat.otherUser?.id || chat.userId || chat.id;
            const res = await apiFetch(`/api/users/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                setBlockStatus({ isBlocked: data.isBlocked, blockedByMe: data.blockedByMe });
            }
        } catch (e) { console.error("Block status check error:", e); }
    }, [chat?.id, chat?.type, chat?.userId, chat?.otherUser?.id]);

    useEffect(() => {
        if (chat?.id) {
            fetchActiveSession();
            checkIfContact();
            fetchBlockStatus();
            if (chat.isTrade) fetchTradeDetails();
        }
    }, [chat?.id, chat?.isTrade, fetchActiveSession, checkIfContact, fetchTradeDetails, fetchBlockStatus]);

    useEffect(() => {
        if (socket && isConnected && chat?.id) {
            const handleSessionUpdate = (session: any) => {
                const matches = session.chat_id === chat.id ||
                    session.expert_id === chat.userId ||
                    session.client_id === chat.userId;

                if (matches) {
                    if (session.status === 'completed' || session.status === 'cancelled') {
                        setActiveSession(null);
                    } else {
                        setActiveSession(session);
                    }
                }
            };

            socket.on('service_session_updated', handleSessionUpdate);

            // Call Listeners
            socket.on('incoming_call', (data: any) => {
                setCallData(data);
                setIsIncomingCall(true);
            });

            socket.on('call_accepted', (data: any) => {
                setIsCalling(true);
                startCallTimer();
            });

            socket.on('call_rejected', () => {
                setIsCalling(false);
                setCallData(null);
                alert("Qo'ng'iroq rad etildi");
            });

            socket.on('call_ended', () => {
                endCallUI();
            });

            socket.on('call_signal', async (data: any) => {
                if (!pcRef.current) return;

                try {
                    if (data.signal.type === 'offer') {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
                        const answer = await pcRef.current.createAnswer();
                        await pcRef.current.setLocalDescription(answer);
                        socket.emit('call_signal', { to: data.from, signal: answer });
                    } else if (data.signal.type === 'answer') {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
                    } else if (data.signal.candidate || (typeof data.signal === 'string' && data.signal.includes('candidate'))) {
                        // Handle candidate relay
                        const candidate = data.signal.candidate ? data.signal : data.signal;
                        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (err) {
                    console.error("WebRTC Signaling Error:", err);
                }
            });

            return () => {
                socket.off('service_session_updated', handleSessionUpdate);
                socket.off('incoming_call');
                socket.off('call_accepted');
                socket.off('call_rejected');
                socket.off('call_ended');
                socket.off('call_signal');
            };
        }
    }, [chat?.id, chat?.userId, socket, isConnected]);

    const startCallTimer = () => {
        setCallTimer(0);
        if (callIntervalRef.current) clearInterval(callIntervalRef.current);
        callIntervalRef.current = setInterval(() => {
            setCallTimer(prev => prev + 1);
        }, 1000);
    };


    const formatCallTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const initializePeerConnection = (targetUserId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                console.log("[WebRTC] Sending ICE candidate to", targetUserId);
                socket.emit('call_signal', { to: targetUserId, signal: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pcRef.current = pc;
        return pc;
    };

    const startLocalStream = async (wantVideo: boolean = false) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: wantVideo
            });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error("Media access error:", err);
            return null;
        }
    };

    const handleCall = async () => {
        if (!socket || !chat) return;
        const targetUserId = String(chat.otherUser?.id || chat.userId || chat.id);
        const myName = JSON.parse(localStorage.getItem('user') || '{}').name || "User";

        setIsCalling(true);
        const stream = await startLocalStream(callType === 'video');
        const pc = initializePeerConnection(targetUserId);

        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call_user', {
            targetUserId,
            fromName: myName,
            signal: offer
        });
    };

    const handleAcceptCall = async () => {
        if (!socket || !callData) return;
        setIsIncomingCall(false);
        setIsCalling(true);
        startCallTimer();

        const stream = await startLocalStream(callType === 'video');
        const pc = initializePeerConnection(callData.from);

        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        // The offer came in the initial signal or will come through call_signal
        if (callData.signal && callData.signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(callData.signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('accept_call', { to: callData.from, signal: answer });
        } else {
            socket.emit('accept_call', { to: callData.from, signal: { type: 'accept' } });
        }
    };

    const handleRejectCall = () => {
        if (!socket || !callData) return;
        socket.emit('reject_call', { to: callData.from });
        setIsIncomingCall(false);
        setCallData(null);
    };

    const handleEndCall = () => {
        if (!socket) return;
        const targetId = callData?.from || chat.otherUser?.id || chat.userId || chat.id;
        socket.emit('end_call', { to: String(targetId) });
        endCallUI();
    };

    const endCallUI = () => {
        setIsCalling(false);
        setIsIncomingCall(false);
        setCallData(null);
        if (callIntervalRef.current) clearInterval(callIntervalRef.current);

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        setRemoteStream(null);
    };
    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
        setShowScrollButton(false);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
        setShowScrollButton(!bottom && e.currentTarget.scrollTop < e.currentTarget.scrollHeight - 300);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!socket || !chat) return;
        const handleTyping = (data: any) => {
            if (data.roomId === chat.id && data.senderId !== JSON.parse(localStorage.getItem('user') || '{}').id) {
                setIsSomeoneTyping(true);
            }
        };
        const handleStopTyping = (data: any) => {
            if (data.roomId === chat.id) setIsSomeoneTyping(false);
        };
        socket.on('typing', handleTyping);
        socket.on('stop_typing', handleStopTyping);
        return () => {
            socket.off('typing', handleTyping);
            socket.off('stop_typing', handleStopTyping);
        };
    }, [socket, chat]);

    const markAsRead = useCallback(async () => {
        if (!chat || !chat.id) return;
        if (onMarkAsRead) {
            onMarkAsRead(chat.id);
        } else {
            try {
                await apiFetch(`/api/chats/${chat.id}/read`, { method: 'POST' });
            } catch (e) { console.error("Mark as read error:", e); }
        }
    }, [chat?.id, onMarkAsRead]);

    useEffect(() => {
        if (!socket || !chat) return;
        setMessages([]);
        const fetchHistory = async () => {
            if (!chat.id) return;
            try {
                const res = await apiFetch(`/api/chats/${chat.id}/messages`);
                if (res.ok) {
                    const history = await res.json();
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const mapped = history.map((m: any) => ({
                        id: m.id,
                        text: m.content,
                        sender: String(m.sender_id) === String(user.id) ? 'me' : 'them',
                        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: m.type || 'text',
                        metadata: m.metadata
                    }));
                    setMessages(mapped);
                    setTimeout(() => scrollToBottom('auto'), 50);
                    markAsRead(); // Mark as read when history is fetched
                }
            } catch (err) { console.error(err); }
        };
        fetchHistory();
        socket.emit('join_room', chat.id);
        const handleReceiveMessage = (message: any) => {
            const msgRoomId = message.chat_id || message.roomId;
            if (String(msgRoomId) === String(chat.id)) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const senderId = message.sender_id || message.senderId;
                const newMessage = {
                    id: message.id,
                    text: message.content,
                    sender: String(senderId) === String(user.id) ? 'me' : 'them',
                    time: new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: message.type || 'text',
                    clientSideId: message.clientSideId,
                    metadata: message.metadata
                };
                setMessages((prev) => {
                    const exists = prev.some(m => String(m.id) === String(newMessage.id));
                    if (exists) return prev;
                    const optimisticIndex = newMessage.clientSideId ? prev.findIndex(m => String(m.id) === String(newMessage.clientSideId)) : -1;
                    if (optimisticIndex !== -1) {
                        const newMsgs = [...prev];
                        newMsgs[optimisticIndex] = newMessage;
                        return newMsgs;
                    }
                    return [...prev, newMessage];
                });
                setTimeout(() => scrollToBottom('auto'), 50);
                if (String(senderId) !== String(user.id)) {
                    if (audioRef.current) audioRef.current.play().catch(() => { });
                    markAsRead(); // Mark as read when new message arrives in active chat
                }
            }
        };
        socket.on('receive_message', handleReceiveMessage);
        return () => { socket.off('receive_message', handleReceiveMessage); };
    }, [socket, chat, markAsRead]);

    const sendMessage = () => {
        if (!inputValue.trim() || !chat || !socket) return;
        const clientSideId = `temp_${Date.now()}`;
        socket.emit('send_message', { roomId: chat.id, content: inputValue, type: 'text', clientSideId });
        setMessages(prev => [...prev, { id: clientSideId, text: inputValue, sender: 'me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }]);
        setInputValue("");
        setReplyTo(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isFolder = false) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingMedia(true);
        const { uploadFileWithProgress } = await import('@/lib/upload');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const tempId = `temp_${Date.now()}_${i}`;

            // Optimistic UI for each file
            const initialType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : (file.type.startsWith('audio/') ? 'voice' : 'file'));

            setMessages(prev => [...prev, {
                id: tempId,
                text: file.name,
                sender: 'me',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: initialType,
                isUploading: true
            }]);

            const formData = new FormData();
            formData.append('files', file); // Backend now expects 'files' array

            try {
                const data = await uploadFileWithProgress('/api/media/upload', formData, (progress) => {
                    setUploadProgresses(prev => ({ ...prev, [tempId]: progress.percent }));
                });

                if (data.files && data.files.length > 0) {
                    const uploadedFile = data.files[0];
                    if (socket) {
                        socket.emit('send_message', {
                            roomId: chat.id,
                            content: uploadedFile.url,
                            type: uploadedFile.mimetype.startsWith('image/') ? 'image' : (uploadedFile.mimetype.startsWith('video/') ? 'video' : 'file'),
                            clientSideId: tempId
                        });
                    }
                    // Update state to remove progress and mark as uploaded
                    setUploadProgresses(prev => {
                        const next = { ...prev };
                        delete next[tempId];
                        return next;
                    });
                }
            } catch (err) {
                console.error("Upload failed for", file.name, err);
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, error: 'Yuklashda xato' } : m));
            }
        }
        setIsUploadingMedia(false);
        if (e.target) e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const fakeEvent = { target: { files: e.dataTransfer.files } } as any;
            handleFileUpload(fakeEvent);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

                setIsUploadingMedia(true);
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await apiFetch(`/api/media/upload`, { method: 'POST', body: formData });
                    if (res.ok) {
                        const data = await res.json();
                        const clientSideId = `voice_${Date.now()}`;
                        if (socket) {
                            socket.emit('send_message', { roomId: chat.id, content: data.url, type: 'voice', clientSideId });
                        }
                        setMessages(prev => [...prev, { id: clientSideId, text: data.url, sender: 'me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'voice' }]);
                    }
                } catch (err) { console.error("Voice upload error:", err); }
                finally { setIsUploadingMedia(false); }

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone access error:", err);
            alert("Mikrofonga ruxsat berilmagan!");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const filteredMessages = searchQuery.trim()
        ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    useEffect(() => {
        (window as any).currentSearchQuery = searchQuery;
    }, [searchQuery]);

    if (!chat) return <div className="flex-1 flex items-center justify-center text-white/40">Suhbatni tanlang</div>;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isTrade = chat?.isTrade;
    const isBuyer = tradeData?.buyer_id === currentUser.id;
    const isSeller = tradeData?.seller_id === currentUser.id;
    const roleLabel = isTrade ? (isBuyer ? 'Xaridor' : isSeller ? 'Sotuvchi' : 'Savdo Ishtirokchisi') : null;
    const displayName = isTrade ? roleLabel : chat.name;

    const isOnlineHeader = chat.online || isOnline || chat.otherUser?.online;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Header */}
            <header className="flex items-center justify-between p-4 lg:pt-4 pt-[max(2rem,env(safe-area-inset-top))] border-b border-white/10 z-20 glass-premium shrink-0">
                {debugError && (
                    <div className="absolute top-full left-0 right-0 bg-red-500/80 text-white text-[10px] p-1 text-center animate-shake">
                        {debugError}
                    </div>
                )}
                {isSelecting ? (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setIsSelecting(false); setSelectedMessageIds([]); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <span className="text-white font-medium">{selectedMessageIds.length} ta xabar tanlandi</span>
                        </div>
                        {selectedMessageIds.length > 0 && (
                            <button onClick={handleDeleteSelected} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors flex items-center gap-2 px-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                <span className="text-sm font-bold hidden sm:block">O'chirish</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="lg:hidden p-2 -ml-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all active:scale-95"
                                    aria-label="Back"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            <div className="flex items-center gap-2 cursor-pointer group" onClick={onToggleInfo}>
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center text-white font-bold overflow-hidden transition-transform group-hover:scale-105 ${isTrade ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                                        {(() => {
                                            const avatar = chat.avatar || chat.otherUser?.avatar || chat.otherUser?.avatar_url;
                                            if (avatar && avatar !== 'null' && avatar !== '') {
                                                const src = avatar.startsWith('http') ? avatar : (avatar.startsWith('data:') ? avatar : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}${avatar.startsWith('/') ? '' : '/'}${avatar}`);
                                                return <img src={src} className="w-full h-full object-cover" onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement!.innerText = displayName ? displayName[0].toUpperCase() : '?';
                                                }} />;
                                            }
                                            return displayName ? displayName[0].toUpperCase() : '?';
                                        })()}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1c20] ${isOnlineHeader ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-500'}`}></div>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold leading-tight truncate max-w-[150px] sm:max-w-[300px] group-hover:text-blue-400 transition-colors">{displayName}</h3>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                        {isTrade ? 'Savdo Chati' : (isOnlineHeader ? 'Onlayn' : 'Oflayn')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {showSearch && (
                                <input
                                    autoFocus
                                    className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white outline-none animate-scale-in hidden md:block w-48"
                                    placeholder="Xabarlardan qidirish..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            )}
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className={`p-2 rounded-full transition-all ${showSearch ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                            <button
                                onClick={() => setIsSelecting(true)}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block"
                                title="Xabarlarni tanlash"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            {!isTrade && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => { setCallType('audio'); setTimeout(() => handleCall(), 0); }}
                                        className="p-2 text-white/60 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                                        title="Ovozli chaqiruv"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => { setCallType('video'); setTimeout(() => handleCall(), 0); }}
                                        className="p-2 text-white/60 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
                                        title="Videochaqiruv"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                </div>
                            )}
                            <div className="relative">
                                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`p-2 rounded-full transition-all ${showMoreMenu ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                </button>

                                {showMoreMenu && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                                        <div className="absolute top-full right-0 mt-2 w-64 glass-premium border border-white/10 rounded-2xl shadow-2xl py-2 z-40 animate-scale-in">
                                            <button onClick={() => {
                                                setIsSelecting(true);
                                                setShowMoreMenu(false);
                                            }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors sm:hidden">
                                                <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>Xabarlarni tanlash</span>
                                            </button>
                                            <button className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                    <span>Bildirishnomalarni o'chirish</span>
                                                </div>
                                                <svg className="h-4 w-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                            <div className="h-px bg-white/5 my-1" />
                                            <button onClick={() => { onToggleInfo?.(); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                                                <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                <span>Profilni ko'rsatish</span>
                                            </button>
                                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                                                <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                <span>Oboy o'rnatish</span>
                                            </button>
                                            <button onClick={handleExportHistory} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                                                <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                                <span>Chat tarixini eksport qilish</span>
                                            </button>
                                            <button onClick={handleClearHistory} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                                                <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                <span>Tarixni tozalash</span>
                                            </button>
                                            <button onClick={handleDeleteChat} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                                <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                <span>Chatni o'chirish</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </header>

            {/* Special Banners Container */}
            <div className="z-10 px-4 space-y-2">
                {/* Unknown Contact Bar */}
                {!isContact && !isTrade && (
                    <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-3 flex items-center justify-between shadow-lg animate-slide-up">
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-white/80 text-xs font-medium">Foydalanuvchi kontaktlarda yo'q</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddContact}
                                disabled={isAddingContact}
                                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                                {isAddingContact ? 'Saqlanmoda...' : 'Qо\'shish'}
                            </button>
                            <button onClick={handleRejectCall} className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition-all">Bloklash</button>
                        </div>
                    </div>
                )}

                {/* P2P Trade Banner */}
                {isTrade && tradeData && (
                    <div className="bg-emerald-600/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center shadow-lg animate-fade-in relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">P2P Savdo #{tradeData.id.substring(0, 8)}</h4>
                                <p className="text-emerald-400/70 text-[10px] font-medium uppercase tracking-wider">{tradeData.status} • {tradeData.amount_uzs.toLocaleString()} UZS</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Service Escrow Banner */}
                {activeSession && (
                    <div className="bg-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 flex justify-between items-center shadow-lg animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Xizmat Sessiyasi</h4>
                                <p className="text-blue-400/70 text-[10px] font-medium uppercase tracking-wider">{activeSession.status} • {activeSession.amount_mali} MALI Escrowda</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative ${isDragging ? 'bg-blue-500/10' : ''}`}
                onScroll={handleScroll}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm pointer-events-none">
                        <div className="bg-[#1e293b] border-2 border-dashed border-blue-500 p-8 rounded-3xl flex flex-col items-center gap-4 animate-scale-in">
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <span className="text-white font-bold">Fayllarni bu yerga tashlang</span>
                        </div>
                    </div>
                )}
                {filteredMessages.map((msg, i) => (
                    <MessageBubble
                        key={msg.id || i}
                        message={{ ...msg, timestamp: msg.time, isOwn: msg.sender === 'me' }}
                        onReply={setReplyTo}
                        isSelecting={isSelecting}
                        isSelected={selectedMessageIds.includes(msg.id)}
                        onSelect={() => toggleSelection(msg.id)}
                        uploadProgress={uploadProgresses[msg.id]}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pt-0 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+1rem))]">
                <GlassCard className="flex items-center gap-2 !p-2 border border-white/10 !bg-black/20">
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="*" onChange={handleFileUpload} />
                    <input type="file" ref={folderInputRef} className="hidden" multiple {...({ webkitdirectory: "" } as any)} onChange={(e) => handleFileUpload(e, true)} />

                    <div className="flex items-center gap-1">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white/50 hover:text-blue-400 transition-colors" title="Fayl yuborish">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                        <button onClick={() => folderInputRef.current?.click()} className="p-2 text-white/50 hover:text-amber-400 transition-colors" title="Papka yuborish">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 flex items-center bg-transparent border-none outline-none text-white text-sm min-h-[40px]">
                        {isRecording ? (
                            <div className="flex items-center gap-3 w-full animate-pulse text-red-400 font-bold">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span>Yozilmoqda {formatCallTime(recordingTime)}</span>
                                <button onClick={() => {
                                    setIsRecording(false);
                                    if (timerRef.current) clearInterval(timerRef.current);
                                    if (mediaRecorderRef.current) mediaRecorderRef.current.ondataavailable = null;
                                    mediaRecorderRef.current?.stop();
                                }} className="ml-auto text-[10px] uppercase tracking-widest text-white/40 hover:text-white">Bekor qilish</button>
                            </div>
                        ) : (
                            <input
                                className="w-full bg-transparent border-none outline-none text-white"
                                placeholder="Xabar yozing..."
                                value={inputValue}
                                onChange={e => {
                                    setInputValue(e.target.value);
                                    if (socket && chat) {
                                        socket.emit('typing', { roomId: chat.id });
                                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                        typingTimeoutRef.current = setTimeout(() => {
                                            socket.emit('stop_typing', { roomId: chat.id });
                                        }, 2000);
                                    }
                                }}
                                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                            />
                        )}
                    </div>
                    {inputValue.trim() || isRecording ? (
                        <button
                            onClick={isRecording ? stopRecording : sendMessage}
                            className={`p-2 rounded-full text-white transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}
                        >
                            {isRecording ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>
                    )}
                </GlassCard>
            </div>

            {/* Premium Call Interface */}
            {(isIncomingCall || isCalling) && (
                <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-3xl flex flex-col items-center justify-between py-20 animate-fade-in shadow-2xl">
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            {callType === 'video' ? (
                                <div className="relative w-full max-w-4xl h-[60vh] bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Local View (PiP) */}
                                    <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-black/40 group-hover:scale-105 transition-transform">
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover mirror"
                                        />
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-premium px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-white text-sm font-medium">{callData?.fromName || displayName}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full glass-premium border-2 border-white/20 flex items-center justify-center text-5xl font-bold text-white mb-6 shadow-2xl overflow-hidden animate-pulse-subtle">
                                    {(() => {
                                        const avatar = chat?.avatar || chat?.otherUser?.avatar || chat?.otherUser?.avatar_url || callData?.fromAvatar;
                                        if (avatar && avatar !== 'null' && avatar !== '') {
                                            const src = avatar.startsWith('http') ? avatar : (avatar.startsWith('data:') ? avatar : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}${avatar.startsWith('/') ? '' : '/'}${avatar}`);
                                            return <img src={src} className="w-full h-full object-cover" />;
                                        }
                                        return (displayName || callData?.fromName || "?")[0].toUpperCase();
                                    })()}
                                </div>
                            )}
                        </div>
                        <h2 className={`font-bold text-white transition-all ${callType === 'video' ? 'text-xl mt-4 opacity-60' : 'text-3xl mb-2'}`}>{callData?.fromName || displayName}</h2>
                        {isIncomingCall ? (
                            <p className="text-blue-400 animate-bounce tracking-wide">Sizga qo'ng'iroq qilinmoqda...</p>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-white/40 text-xs uppercase tracking-[0.2em]">{callType === 'video' ? 'Videochaqiruv' : 'Ovozli chaqiruv'}</p>
                                <p className="text-blue-400 font-mono text-lg tracking-widest">{formatCallTime(callTimer)}</p>
                                {callType !== 'video' && (
                                    <p className="text-white/20 text-[10px] max-w-[200px] text-center mt-4 italic opacity-50">Agar videochaqiruvni boshlamoqchi bo'lsangiz, kamera belgisini bosing.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-8">
                        {isIncomingCall ? (
                            <div className="flex gap-12">
                                <button onClick={handleRejectCall} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <button onClick={handleAcceptCall} className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={async () => {
                                        const newType = callType === 'video' ? 'audio' : 'video';
                                        setCallType(newType);
                                        // Update stream if call is active
                                        if (isCalling && !isIncomingCall) {
                                            const stream = await startLocalStream(newType === 'video');
                                            if (stream && pcRef.current) {
                                                const videoTrack = stream.getVideoTracks()[0];
                                                const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
                                                if (sender && videoTrack) {
                                                    sender.replaceTrack(videoTrack);
                                                } else if (videoTrack) {
                                                    pcRef.current.addTrack(videoTrack, stream);
                                                }
                                            }
                                        }
                                    }}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-xl ${callType === 'video' ? 'bg-blue-500' : 'glass-premium border border-white/10 hover:bg-white/10'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                                <button onClick={handleEndCall} className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15.46l-5.27-.61-2.52 2.52c-2.83-1.44-5.15-3.75-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.15 10.85 21.56 21 21v-5.54z" /></svg>
                                </button>
                                <button className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-xl glass-premium border border-white/10 hover:bg-white/10`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isUploadingMedia && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-white text-sm font-medium">Fayllar yuklanmoqda...</span>
                </div>
            )}
        </div>
    );
}

