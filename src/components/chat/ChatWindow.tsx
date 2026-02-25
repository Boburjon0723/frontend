import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { MessageBubble } from './MessageBubble';
import SendCoinModal from './SendCoinModal';
import MediaPreviewModal from './MediaPreviewModal';
import { useSocket } from '@/context/SocketContext'; // Import socket hook

// Mock Messages (Initial State)
// Initial state should be empty or fetched
const INITIAL_MESSAGES: any[] = [];

interface ChatWindowProps {
    chat?: any;
    onToggleInfo?: () => void;
    onBack?: () => void;
}

export default function ChatWindow({ chat, onToggleInfo, onBack }: ChatWindowProps) {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<any[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [debugError, setDebugError] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<any | null>(null);
    const [showSendCoinModal, setShowSendCoinModal] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [tradeData, setTradeData] = useState<any>(null);
    const [isContact, setIsContact] = useState<boolean>(true); // Default true to avoid flickering
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [blockStatus, setBlockStatus] = useState<{ isBlocked: boolean, blockedByMe: boolean }>({ isBlocked: false, blockedByMe: false });

    // Media States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [mediaPreviewFile, setMediaPreviewFile] = useState<File | null>(null);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    const fetchTradeDetails = useCallback(async () => {
        if (!chat || !chat.isTrade || !chat.tradeId) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/trade/${chat.tradeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTradeData(data);
            }
        } catch (e) { console.error(e); }
    }, [chat?.tradeId, chat?.isTrade]);

    const fetchActiveSession = useCallback(async () => {
        if (!chat || !chat.id) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app' || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/p2p/trades`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/users/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

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
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const res = await fetch(`${API_URL}/api/users/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    contactUserId: targetId,
                    name: chat.name || chat.otherUser?.name || 'User',
                    surname: chat.otherUser?.surname || ''
                })
            });

            if (res.ok) {
                setIsContact(true);
                window.dispatchEvent(new Event('contacts_updated'));
            } else {
                const errData = await res.json();
                alert(`Kontaktni saqlashda xato: ${errData.message || 'Nomaʼlum xato'}`);
            }
        } catch (e) { console.error(e); }
        finally { setIsAddingContact(false); }
    };

    const fetchBlockStatus = useCallback(async () => {
        if (!chat || chat.type !== 'private') return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';
            const targetId = chat.otherUser?.id || chat.userId || chat.id;
            const res = await fetch(`${API_URL}/api/users/${targetId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
        const handleUpdate = () => {
            fetchBlockStatus();
            checkIfContact();
        };
        window.addEventListener('contacts_updated', handleUpdate);
        window.addEventListener('block_status_changed', handleUpdate);
        return () => {
            window.removeEventListener('contacts_updated', handleUpdate);
            window.removeEventListener('block_status_changed', handleUpdate);
        };
    }, [fetchBlockStatus, checkIfContact]);

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
            return () => {
                socket.off('service_session_updated', handleSessionUpdate);
            };
        }
    }, [chat?.id, chat?.userId, socket, isConnected]);

    const handleSendCoin = async (amount: number, pin: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';

            let receiverId = chat.userId || chat.id;

            // Try to find the other participant if it's a DM-like structure with participants array
            if (chat.participants && Array.isArray(chat.participants)) {
                const myId = JSON.parse(localStorage.getItem('user') || '{}').id;
                const other = chat.participants.find((p: any) => {
                    const pId = typeof p === 'string' ? p : p._id || p.id;
                    return String(pId) !== String(myId);
                });
                if (other) receiverId = typeof other === 'string' ? other : other._id || other.id;
            }

            const res = await fetch(`${API_URL}/api/token/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receiverId, amount, pin })
            });

            if (res.ok) {
                if (socket && isConnected) {
                    socket.emit('send_message', {
                        roomId: chat.id,
                        content: `💸 Sent ${amount} MALI`,
                        type: 'transaction',
                        metadata: { amount, status: 'completed', currency: 'MALI' }
                    });
                }
                return { success: true };
            } else {
                const err = await res.json();
                return { success: false, error: err.message || 'Transfer failed' };
            }
        } catch (error: any) {
            console.error("Transfer error:", error);
            return { success: false, error: error.message || 'Network error' };
        }
    };

    const [showScrollButton, setShowScrollButton] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Use a reliable CDN for the notification sound to avoid 404 errors if local file is missing
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

        // Typing Listeners
        const handleTyping = (data: any) => {
            if (data.roomId === chat.id && data.senderId !== JSON.parse(localStorage.getItem('user') || '{}').id) {
                setIsSomeoneTyping(true);
            }
        };

        const handleStopTyping = (data: any) => {
            if (data.roomId === chat.id) {
                setIsSomeoneTyping(false);
            }
        };

        socket.on('typing', handleTyping);
        socket.on('stop_typing', handleStopTyping);

        return () => {
            socket.off('typing', handleTyping);
            socket.off('stop_typing', handleStopTyping);
        };
    }, [socket, chat]);

    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        if (!socket || !chat) return;

        // Check if chat user is one of the participants in the room if it's 1:1, 
        // but here we need to know the specific userId of the other person.
        // Assuming chat object has `participantId` or we derive it.
        // For now, let's assume `chat.id` might be the user ID if it's a DM, 
        // OR we need to fetch initial status. 
        // WE WILL LISTEN TO ALL STATUS CHANGES and filter.

        // FIXME: We need the TARGET USER ID to check status. 
        // If chat.type === 'dm', the other user's ID should be in chat object.
        // Let's assume chat.userId exist or we use chat.id as a fallback for now.
        const targetUserId = chat.userId || chat.id;

        const handleStatusChange = (data: { userId: string, status: string }) => {
            if (data.userId === targetUserId) {
                setIsOnline(data.status === 'online');
            }
        };

        socket.on('user_status_change', handleStatusChange);

        return () => {
            socket.off('user_status_change', handleStatusChange);
        };
    }, [socket, chat]);

    // Input Change Handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        if (!socket || !chat) return;

        // Emit typing
        socket.emit('typing', chat.id);

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set timeout to stop typing after 2s of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', chat.id);
        }, 2000);
    };

    useEffect(() => {
        if (!socket || !chat) return;

        console.log(`[ChatWindow] Active Chat ID:`, chat.id);
        console.log(`[ChatWindow] Active Chat Obj:`, chat);

        // Reset messages initially
        setMessages([]);
        setDebugError(null);

        const fetchHistory = async () => {
            if (!chat || !chat.id) {
                console.warn("[ChatWindow] No chat ID provided, skipping history fetch.");
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app';

                console.log(`Fetching history from: ${API_URL}/api/chats/${chat.id}/messages`);

                const res = await fetch(`${API_URL}/api/chats/${chat.id}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const history = await res.json();
                    console.log(`[ChatWindow] History loaded: ${history.length} messages`);
                    const mapped = history.map((m: any) => {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const senderId = m.sender_id || m.senderId;
                        const isOwn = String(senderId) === String(user.id || user.userId);
                        return {
                            id: m._id || m.id,
                            text: m.content,
                            sender: isOwn ? 'me' : 'them',
                            time: new Date(m.created_at || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            type: m.type || 'text',
                            metadata: m.metadata
                        };
                    });
                    setMessages(mapped);
                    setTimeout(scrollToBottom, 100);
                } else {
                    const errText = await res.text();
                    console.error("[ChatWindow] Fetch history failed:", res.status, errText);
                    setDebugError(`Error ${res.status}: ${errText.substring(0, 100)}`);
                }
            } catch (err: any) {
                console.error("Failed to load history", err);
                setDebugError(`Network Error: ${err.message}`);
            }
        };

        fetchHistory();

        // Join the specific chat room
        socket.emit('join_room', chat.id);
        console.log(`[ChatWindow] Joining room: ${chat.id}`);

        // Listen for new messages
        // Listen for new messages
        const handleReceiveMessage = (message: any) => {
            const msgRoomId = message.chat_id || message.roomId;
            console.log(`[ChatWindow] 📨 Received message for room ${msgRoomId}:`, message);
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            if (String(msgRoomId) === String(chat.id)) {
                const senderId = message.sender_id || message.senderId;
                const newMessage = {
                    id: message._id || message.id || Date.now(),
                    text: message.content,
                    sender: String(senderId) === String(user.id || user.userId) ? 'me' : 'them',
                    time: new Date(message.created_at || undefined).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: message.type || 'text',
                    replyTo: message.replyTo,
                    clientSideId: message.clientSideId,
                    metadata: message.metadata
                };

                setMessages((prev) => {
                    // 1. Check if this exact server ID already exists
                    if (prev.some(m => String(m.id) === String(newMessage.id))) return prev;

                    // 2. Check for an optimistic message match
                    // We match if:
                    // - It has the same clientSideId
                    // - OR (if no clientSideId) it's from 'me', has same text, and is a 'temp_' message
                    let optimisticIndex = -1;

                    if (newMessage.clientSideId) {
                        optimisticIndex = prev.findIndex(m => String(m.id) === String(newMessage.clientSideId));
                    }

                    if (optimisticIndex === -1 && newMessage.sender === 'me') {
                        // Fuzzy match: Find the LATEST temporary message with the same content
                        for (let i = prev.length - 1; i >= 0; i--) {
                            if (String(prev[i].id).startsWith('temp_') && prev[i].text === newMessage.text) {
                                optimisticIndex = i;
                                break;
                            }
                        }
                    }

                    if (optimisticIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[optimisticIndex] = { ...newMessage, id: newMessage.id }; // Update to real ID
                        return newMessages;
                    }

                    return [...prev, newMessage];
                });
                setTimeout(scrollToBottom, 50);
            } else {
                console.warn(`[ChatWindow] Message room mismatch. Current: ${chat.id}, Incoming: ${msgRoomId}`);
            }

            // Notification sound
            const senderId = message.sender_id || message.senderId;
            if (String(msgRoomId) === String(chat.id) && String(senderId) !== String(user.id || user.userId)) {
                if (audioRef.current) {
                    audioRef.current.play().catch(() => { });
                }
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, chat]);

    const sendMessage = () => {
        if (!inputValue.trim() || !chat) return;

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Optimistic update
        const clientSideId = `temp_${Date.now()}`;
        const optimisticMessage = {
            id: clientSideId,
            text: inputValue,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        // Send to backend
        if (socket && isConnected) {
            console.log(`[ChatWindow] Sending message to room ${chat.id}: "${inputValue}"`);
            socket.emit('send_message', {
                roomId: chat.id,
                content: inputValue,
                type: 'text',
                clientSideId: clientSideId
            });
        } else {
            console.error(`[ChatWindow] Cannot send message: Socket connected=${isConnected}`);
        }

        setInputValue("");
        setReplyTo(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') sendMessage();
    };

    // Media Logic
    const handleFileClick = () => fileInputRef.current?.click();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Show preview modal before sending
        setMediaPreviewFile(file);
        // Reset file input so same file can be selected again
        e.target.value = '';
    };

    const handleMediaSend = async (caption: string) => {
        const file = mediaPreviewFile;
        if (!file) return;
        setMediaPreviewFile(null);
        setIsUploadingMedia(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/api/media/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                let type: 'image' | 'video' | 'file' = 'file';
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('video/')) type = 'video';

                sendMediaMessage(data.url, type);

                // Send caption as a separate text message if provided
                if (caption.trim()) {
                    setTimeout(() => {
                        sendMediaMessage(caption, 'text');
                    }, 300);
                }
            }
        } catch (err) { console.error("Upload error:", err); }
        finally { setIsUploadingMedia(false); }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await uploadVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) { console.error("Mic error:", err); alert("Mikrofonga ruxsat berilmagan"); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const uploadVoiceMessage = async (blob: Blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'voice.webm');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app'}/api/media/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                sendMediaMessage(data.url, 'voice');
            }
        } catch (err) { console.error("Voice upload error:", err); }
    };

    const sendMediaMessage = (url: string, type: 'image' | 'file' | 'voice' | 'video' | 'text') => {
        if (!socket || !chat) return;

        socket.emit('send_message', {
            roomId: chat.id,
            content: url,
            type: type
        });

        // Optimistic update
        const optimisticMessage = {
            id: Date.now(),
            text: url,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: type
        };
        setMessages((prev) => [...prev, optimisticMessage]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };


    if (!chat) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-6 animate-fade-in relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

                <div className="relative z-10 w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-black/50 overflow-hidden group hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                </div>

                <div className="text-center relative z-10 max-w-xs px-6">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-3 tracking-tight">Keling, gaplashamiz!</h2>
                    <p className="text-white/40 text-sm leading-relaxed font-light">
                        Chap tomondagi ro'yxatdan kontaktni tanlang yoki <span className="text-blue-400 font-medium cursor-pointer hover:underline">yangi suhbat</span> boshlang.
                    </p>
                </div>
            </div>
        );
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isTrade = chat?.isTrade;
    const isBuyer = tradeData?.buyer_id === currentUser.id;
    const isSeller = tradeData?.seller_id === currentUser.id;
    const roleLabel = isTrade ? (isBuyer ? 'Xaridor' : isSeller ? 'Sotuvchi' : 'Savdo Ishtirokchisi') : null;
    const displayName = isTrade ? roleLabel : chat.name;

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <GlassCard className="flex items-center justify-between !p-3 mb-4 sticky top-0 z-10 !border-none">
                {debugError && (
                    <div className="absolute top-12 left-0 right-0 bg-red-500/80 text-white text-xs p-1 text-center z-50">
                        {debugError}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="lg:hidden p-2 -ml-2 text-white/50 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={onToggleInfo}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform group-hover:scale-105 overflow-hidden ${isTrade ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-blue-400 to-purple-500'}`}>
                            {(() => {
                                const avatar = chat.avatar || chat.otherUser?.avatar || chat.otherUser?.avatar_url;
                                if (!isTrade && avatar && avatar !== 'null' && avatar !== '' && avatar !== 'use_initials') {
                                    const src = avatar.startsWith('http') || avatar.startsWith('data:')
                                        ? avatar
                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app'}/${avatar}`;
                                    return (
                                        <img
                                            src={src}
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerText = displayName ? displayName.substring(0, 1).toUpperCase() : '?';
                                            }}
                                        />
                                    );
                                }
                                return <span>{displayName ? displayName.substring(0, 1).toUpperCase() : '?'}</span>;
                            })()}
                        </div>
                        <div>
                            <h2 className="text-[var(--text-primary)] font-medium text-lg leading-tight group-hover:text-white transition-colors">{displayName}</h2>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}></span>
                                <p className="text-xs text-[var(--text-secondary)] group-hover:text-white/60 transition-colors">
                                    {isTrade ? 'Anonim Savdo Chati' : (isOnline ? 'Online' : 'Offline')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                    {!isTrade && (
                        <>
                            <button className="hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                            <button className="hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </button>
                        </>
                    )}
                    <button className="hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                </div>
            </GlassCard>

            {/* Unknown Contact Bar (Telegram Style) */}
            {!isContact && !isTrade && (
                <div className="mx-2 mb-4 animate-[slide-down_0.3s_ease-out]">
                    <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-white/80 text-sm font-medium">Ushbu foydalanuvchi kontaktlaringizda yo'q</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddContact}
                                disabled={isAddingContact}
                                className="px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                                {isAddingContact ? 'Saqlanimoda...' : 'Qо\'shish'}
                            </button>
                            <button
                                onClick={() => { /* Block logic */ alert("Foydalanuvchi bloklandi (Simulyatsiya)"); setIsContact(true); }}
                                className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all"
                            >
                                Bloklash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* P2P TRADE BANNER */}
            {isTrade && tradeData && (
                <div className="mx-2 mb-4 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>

                        <div className="flex w-full justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold text-base truncate max-w-[150px]">P2P Savdo #{tradeData.id.substring(0, 8)}</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                            {tradeData.status}
                                        </span>
                                    </div>
                                    <p className="text-emerald-200/50 text-xs mt-0.5">Mablag'lar escrow tizimida himoyalangan</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Jami summa</div>
                                <div className="text-emerald-400 font-bold text-lg">{parseFloat(tradeData.amount_uzs).toLocaleString()} UZS</div>
                            </div>
                        </div>

                        <div className="w-full bg-white/5 rounded-xl p-3 border border-white/5 flex justify-around">
                            <div className="text-center">
                                <div className="text-[9px] text-white/30 uppercase font-bold">MALI Miqdori</div>
                                <div className="text-white font-medium">{parseFloat(tradeData.amount_mali).toLocaleString()} MALI</div>
                            </div>
                            <div className="w-px h-8 bg-white/10 self-center"></div>
                            <div className="text-center">
                                <div className="text-[9px] text-white/30 uppercase font-bold">Kurs (1 MALI)</div>
                                <div className="text-white font-medium">{(parseFloat(tradeData.amount_uzs) / parseFloat(tradeData.amount_mali)).toLocaleString()} UZS</div>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full">
                            {isBuyer && tradeData.status === 'pending' && (
                                <p className="text-white/60 text-xs italic text-center w-full bg-white/5 py-2 rounded-lg">To'lovingizni amalga oshiring va tasdiqlanishini kuting.</p>
                            )}
                            {isSeller && tradeData.status === 'pending' && (
                                <p className="text-white/60 text-xs italic text-center w-full bg-white/5 py-2 rounded-lg">Xaridor to'lovni amalga oshirishini kuting.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICE ESCROW BANNER */}
            {activeSession && (
                <div className="mx-2 mb-4 animate-fade-in">
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Professional Xizmat Sessiyasi</h3>
                                <p className="text-blue-200/60 text-xs">
                                    {parseFloat(activeSession.amount_mali).toLocaleString()} MALI escrowda saqlanmoqda
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            {activeSession.client_id === JSON.parse(localStorage.getItem('user') || '{}').id ? (
                                <>
                                    <button
                                        onClick={async () => {
                                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app'}/api/service/complete`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                                body: JSON.stringify({ sessionId: activeSession.id })
                                            });
                                            if (res.ok) fetchActiveSession();
                                        }}
                                        className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors"
                                    >
                                        Yakunlash
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend-production-6de74.up.railway.app'}/api/service/cancel`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                                body: JSON.stringify({ sessionId: activeSession.id })
                                            });
                                            if (res.ok) fetchActiveSession();
                                        }}
                                        className="flex-1 md:flex-none px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                                    >
                                        Bekor qilish
                                    </button>
                                </>
                            ) : (
                                <span className="text-xs text-white/40 italic">Mijoz suhbatni yakunlashini kutmoqda...</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar p-2"
                onScroll={handleScroll}
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 animate-fade-in">
                        <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-white/5 animate-pulse-slow">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/40" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                        </div>
                        <p className="text-sm font-medium text-white/50">No messages yet</p>
                        <p className="text-xs text-white/30">Start the conversation with "Hello"</p>
                    </div>
                )}

                {/* Date Grouping Logic */}
                {(() => {
                    const renderList: React.ReactNode[] = [];
                    let lastDate: string | null = null;

                    messages.forEach((msg, index) => {
                        // Fallback date logic since we only have 'time' string in mock state usually
                        // In a real app, use msg.createdAt
                        const dateObj = new Date(); // Mock 'Today'
                        const dateStr = "Today"; // Simplified for now since we don't have full history dates

                        // Show separator if first message or date changed (mock logic always shows 'Today' once)
                        if (dateStr !== lastDate && index === 0) {
                            renderList.push(
                                <div key={`date-${index}`} className="flex justify-center my-4 animate-fade-in">
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-wider font-bold text-white/40 shadow-sm backdrop-blur-md">
                                        {dateStr}
                                    </span>
                                </div>
                            );
                            lastDate = dateStr;
                        }

                        const isOwn = msg.sender === 'me';

                        renderList.push(
                            <MessageBubble
                                key={msg.id || index}
                                message={{
                                    id: msg.id,
                                    text: msg.text,
                                    timestamp: msg.time,
                                    isOwn: isOwn,
                                    senderName: !isOwn ? (displayName || 'User') : undefined,
                                    type: msg.type,
                                    metadata: msg.metadata
                                }}
                                onReply={setReplyTo} // Pass the reply handler
                            />
                        );
                    });

                    return renderList;
                })()}

                <div ref={messagesEndRef} />

                {/* Typing Indicator Bubble */}
                {isSomeoneTyping && (
                    <div className="flex justify-start mb-4 animate-fade-in pl-2">
                        <div className="px-4 py-3 bg-[#2a2a2e]/90 border border-white/5 rounded-[20px] rounded-bl-[4px] backdrop-blur-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="mt-4 sticky bottom-0 z-10 pb-2">
                {/* Reply Preview */}
                {replyTo && (
                    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1e]/90 backdrop-blur-md border-t border-x border-white/10 rounded-t-xl mx-2 animate-fade-in-up">
                        <div className="flex flex-col relative pl-3">
                            <div className="absolute left-0 top-1 bottom-1 w-1 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-blue-400 font-bold mb-0.5">
                                {replyTo.sender === 'me' ? 'Replying to yourself' : `Replying to ${displayName || 'User'}`}
                            </span>
                            <span className="text-sm text-white/70 line-clamp-1 max-w-[200px] sm:max-w-md">
                                {replyTo.text}
                            </span>
                        </div>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {blockStatus.isBlocked ? (
                    <div className="w-full py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-3 animate-fade-in mx-2">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <p className="text-red-400 text-sm font-medium">
                            {blockStatus.blockedByMe
                                ? "Siz bu foydalanuvchini bloklagansiz. Xabar yozish uchun blokdan chiqaring."
                                : "Siz bloklangansiz. Xabar yozish imkonsiz."}
                        </p>
                    </div>
                ) : (
                    <GlassCard className={`!p-2 flex items-center gap-2 border border-white/10 shadow-2xl backdrop-blur-3xl bg-[#1a1a1e]/80 ${replyTo ? '!rounded-t-none !border-t-0' : ''}`}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/mp4,video/mov,video/avi,video/quicktime,video/webm,video/*"
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={handleFileClick}
                            className="p-2 text-[var(--text-secondary)] hover:text-blue-400 transition-colors rounded-full hover:bg-white/5 active:scale-95"
                        >
                            {/* Attach Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        <button
                            onClick={() => setShowSendCoinModal(true)}
                            className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors rounded-full hover:bg-emerald-500/10 active:scale-95"
                            title="Send MALI"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>

                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-[var(--text-tertiary)] py-2 text-[15px]"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                        />

                        <button className="p-2 text-[var(--text-secondary)] hover:text-yellow-400 transition-colors rounded-full hover:bg-white/5 active:scale-95 mr-1">
                            {/* Emoji Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>

                        <button
                            onClick={sendMessage}
                            disabled={!inputValue.trim()}
                            className={`
                                p-2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                                ${inputValue.trim()
                                    ? 'bg-gradient-to-tr from-blue-500 to-purple-600 text-white hover:shadow-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed hidden' // Hide if empty like Telegram/iMessage
                                }
                            `}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>

                        {/* Voice Mic Icon (Show when input empty) */}
                        {!inputValue.trim() && (
                            <div className="flex items-center">
                                {isRecording && (
                                    <span className="text-red-500 text-xs font-mono mr-2 animate-pulse">
                                        {formatTime(recordingTime)}
                                    </span>
                                )}
                                <button
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onMouseLeave={stopRecording}
                                    onTouchStart={startRecording}
                                    onTouchEnd={stopRecording}
                                    className={`p-2 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isRecording ? 'bg-red-500/20 text-red-500 scale-125' : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </GlassCard>
                )}
            </div>

            {/* Scroll to Bottom Button */}
            {
                showScrollButton && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-20 right-6 p-3 bg-[var(--accent-purple-start)] text-white rounded-full shadow-lg shadow-purple-900/40 hover:bg-[var(--accent-purple-end)] transition-all animate-bounce-small z-20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>
                )
            }

            {/* Send Coin Modal */}
            {
                showSendCoinModal && (
                    <SendCoinModal
                        onClose={() => setShowSendCoinModal(false)}
                        recipientName={chat.name || 'User'}
                        onSend={handleSendCoin}
                    />
                )
            }

            {/* Media Preview Modal */}
            {mediaPreviewFile && (
                <MediaPreviewModal
                    file={mediaPreviewFile}
                    onSend={handleMediaSend}
                    onCancel={() => setMediaPreviewFile(null)}
                />
            )}

            {/* Upload Loading Overlay */}
            {isUploadingMedia && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-[13px] text-white/80 font-medium">Yuklanmoqda...</span>
                </div>
            )}
        </div >
    );
}
