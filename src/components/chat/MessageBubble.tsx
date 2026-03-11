'use client';

import React, { useState, useRef, useEffect } from 'react';
import MediaContextMenu from './MediaContextMenu';
import { translateText } from '@/lib/translation';

interface Message {
    id: string;
    text: string;
    timestamp: string;
    isOwn: boolean;
    senderName?: string;
    senderAvatar?: string;
    sender_avatar?: string;
    avatar?: string;
    isAdmin?: boolean;
    type?: string;
    metadata?: any;
    isUploading?: boolean;
    error?: string;
    parentMessage?: any;
    parent_id?: string;
    parentId?: string;
    isPending?: boolean;
    is_read?: boolean;
    reactions?: {
        [emoji: string]: { emoji: string; users: string[] };
    };
}

interface MessageBubbleProps {
    message: Message;
    onReply?: (message: Message) => void;
    isSelecting?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    uploadProgress?: number;
    onMediaClick?: (url: string, type: 'image' | 'video' | 'file') => void;
    onForward?: (message: Message) => void;
    onDelete?: (message: Message) => void;
    isContinuation?: boolean;
    onReplyClick?: (parentId: string) => void;
    activeAudioId?: string | null;
    onAudioPlay?: (id: string | null) => void;
    onReact?: (emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message, onReply, isSelecting, isSelected, onSelect,
    uploadProgress, onMediaClick, onForward, onDelete,
    isContinuation, onReplyClick, activeAudioId, onAudioPlay, onReact
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [translationError, setTranslationError] = useState(false);

    const handleTranslate = async () => {
        if (translatedText) {
            setTranslatedText(null);
            return;
        }
        setIsTranslating(true);
        setTranslationError(false);
        const result = await translateText(message.text, 'uz');
        if (result) setTranslatedText(result);
        else setTranslationError(true);
        setIsTranslating(false);
    };

    const handleMediaContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const isAudioFile = message.type === 'voice' ||
        (message.metadata?.mimetype?.startsWith('audio/')) ||
        (message.text && message.text.toLowerCase().endsWith('.mp3')) ||
        (message.text && message.text.toLowerCase().endsWith('.wav')) ||
        (message.text && message.text.toLowerCase().endsWith('.m4a')) ||
        (message.text && message.text.toLowerCase().endsWith('.ogg'));

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const formatDuration = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        audioRef.current.currentTime = percentage * duration;
    };

    const renderText = () => {
        const text = message.text || "";
        const query = (typeof window !== 'undefined' ? (window as any).currentSearchQuery : "") || "";

        // Helper: highlight search query inside normal text (non-URL)
        const highlightQuery = (segment: string, keyPrefix: string) => {
            if (!query.trim()) return segment;
            const regex = new RegExp(`(${query})`, 'gi');
            const parts = segment.split(regex);
            return parts.map((part, idx) =>
                part.toLowerCase() === query.toLowerCase()
                    ? (
                        <mark
                            key={`${keyPrefix}-h-${idx}`}
                            className="bg-yellow-400/80 text-black rounded-[2px] px-0.5"
                        >
                            {part}
                        </mark>
                    )
                    : <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>
            );
        };

        // Split text by URLs and wrap URLs with anchors
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const segments = text.split(urlRegex);

        return (
            <span>
                {segments.map((segment, i) => {
                    const isUrl = /^https?:\/\//i.test(segment);
                    if (isUrl) {
                        const url = segment;
                        return (
                            <a
                                key={`url-${i}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 underline hover:text-blue-100 break-all"
                            >
                                {url}
                            </a>
                        );
                    }
                    return (
                        <React.Fragment key={`seg-${i}`}>
                            {highlightQuery(segment, `seg-${i}`)}
                        </React.Fragment>
                    );
                })}
            </span>
        );
    };

    // Global audio state sync
    useEffect(() => {
        if (activeAudioId && activeAudioId !== message.id && isPlaying) {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
        }
    }, [activeAudioId, message.id, isPlaying]);

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            onAudioPlay?.(null);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
            onAudioPlay?.(message.id);
        }
    };

    return (
        <div id={`msg-${message.id}`} className={`flex flex-col mb-1 ${message.isOwn ? 'items-end' : 'items-start'} ${isContinuation ? 'mt-[-12px]' : 'mt-2'}`}>
            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] group`}>
                {/* Selection Overlay & Checkbox */}
                {isSelecting && (
                    <div
                        className={`absolute inset-0 z-10 flex items-center ${message.isOwn ? 'justify-start pl-4' : 'justify-end pr-4'} bg-black/0 hover:bg-white/5 transition-colors rounded-xl cursor-pointer`}
                        onClick={onSelect}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                            {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                    </div>
                )}

                {!message.isOwn && (
                    !isContinuation ? (
                        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-blue-500/20 border border-white/10 flex items-center justify-center overflow-hidden text-[10px] font-bold">
                            {message.senderAvatar || message.sender_avatar || message.avatar ? (
                                <img
                                    src={message.senderAvatar || message.sender_avatar || message.avatar}
                                    alt={message.senderName || "User"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : null}
                            <span className="text-blue-400">{(message.senderName || "?")[0].toUpperCase()}</span>
                        </div>
                    ) : (
                        <div className="w-8 flex-shrink-0" /> // Spacer
                    )
                )}

                <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'} gap-1`}>
                    {!message.isOwn && !isContinuation && message.senderName && (
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider px-2">{message.senderName}</span>
                    )}

                    <div className={`relative shadow-sm overflow-hidden min-w-[60px]
                        ${message.type === 'image' || message.type === 'video' ? 'rounded-2xl' : 'px-4 py-3 rounded-2xl'}
                        ${message.isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/10 backdrop-blur-xl text-white border border-white/5 rounded-bl-sm'}
                    `} onContextMenu={isSelecting ? undefined : handleMediaContextMenu}>

                        {/* Parent Message (Reply) Preview */}
                        {message.parentMessage && (
                            <div className="mb-2 px-3 py-1.5 bg-black/10 border-l-2 border-blue-400 rounded-lg cursor-pointer hover:bg-black/20 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReplyClick?.(message.parent_id || message.parentId || message.parentMessage.id);
                                }}>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider truncate">
                                    {message.parentMessage.sender === (message.isOwn ? 'me' : 'them') ? 'Siz' : (message.parentMessage.senderName || 'Foydalanuvchi')}
                                </p>
                                <p className="text-[11px] text-white/60 truncate italic">
                                    {message.parentMessage.type === 'text' ? message.parentMessage.text : (message.parentMessage.type === 'image' ? '🖼️ Rasm' : (message.parentMessage.type === 'video' ? '🎥 Video' : '📄 Fayl'))}
                                </p>
                            </div>
                        )}

                        {message.isUploading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
                                {message.error ? (
                                    <div className="text-red-400 text-center">
                                        <svg className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-[10px] font-bold uppercase">{message.error}</span>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-[120px]">
                                        <div className="flex justify-between text-[10px] text-white font-bold mb-1">
                                            <span>Yuklanmoqda</span>
                                            <span>{uploadProgress || 0}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${uploadProgress || 0}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {message.type === 'image' ? (
                            <div className="relative group/img min-w-[200px] cursor-pointer overflow-hidden" onClick={() => onMediaClick?.(message.text, 'image')}>
                                <img src={(message.text || "").startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://mali-messenger-backend-production.up.railway.app'}${(message.text || "").startsWith('/') ? '' : '/'}${message.text}`} className="w-full max-h-[400px] object-cover rounded-lg" />
                                {message.metadata?.caption && <div className="px-4 py-2 text-sm text-white/90 border-t border-white/5">{message.metadata.caption}</div>}
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold">{message.timestamp}</div>
                            </div>
                        ) : message.type === 'video' ? (
                            <div className="relative min-w-[200px] cursor-pointer group/video" onClick={() => onMediaClick?.(message.text, 'video')}>
                                <video preload="metadata" src={(message.text || "").startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://mali-messenger-backend-production.up.railway.app'}${(message.text || "").startsWith('/') ? '' : '/'}${message.text}`} className="w-full max-h-[400px] object-cover rounded-lg" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/20">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <svg className="h-6 w-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                                {message.metadata?.caption && <div className="px-4 py-2 text-sm text-white/90 border-t border-white/5">{message.metadata.caption}</div>}
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold">{message.timestamp}</div>
                            </div>
                        ) : isAudioFile ? (
                            <div className="flex items-center gap-3 min-w-[260px] py-2 px-1">
                                <button onClick={handlePlayPause} className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all ${isPlaying ? 'bg-blue-600 shadow-blue-500/50' : 'bg-blue-500 hover:bg-blue-400'}`}>
                                    {isPlaying ? (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    ) : (
                                        <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="text-[13px] font-bold text-white truncate mb-1">
                                        {message.metadata?.name
                                            || message.metadata?.file_name
                                            || (message.text && message.text.split('/').pop())
                                            || (message.type === 'voice' ? 'Ovozli xabar' : 'Audio')}
                                    </p>
                                    <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={handleProgressClick}>
                                        <div className="flex-1 h-1.5 bg-white/20 hover:bg-white/30 rounded-full overflow-hidden transition-colors relative">
                                            <div className="absolute top-0 left-0 h-full bg-blue-400" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] font-bold text-white/50">{formatDuration(isPlaying ? currentTime : duration)}</span>
                                        <span className="text-[9px] font-bold text-white/30 uppercase">
                                            {message.type === 'voice' ? 'Voice' : formatFileSize(message.metadata?.size)}
                                        </span>
                                    </div>
                                </div>
                                <audio preload="metadata" ref={audioRef} src={(message.text || "").startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://mali-messenger-backend-production.up.railway.app'}${(message.text || "").startsWith('/') ? '' : '/'}${message.text}`} className="hidden" />
                            </div>
                        ) : message.type === 'file' ? (
                            <div className="flex items-center gap-4 py-2 px-1 min-w-[260px] cursor-pointer group/file" onClick={() => {
                                if (!message.isUploading) {
                                    onMediaClick?.(message.text, 'file');
                                }
                            }}>
                                <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover/file:bg-blue-500/20 border border-white/5 transition-colors flex items-center justify-center text-blue-400 relative">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {!message.isUploading && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0d0d0f]">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-white truncate mb-0.5 group-hover/file:text-blue-400 transition-colors">
                                        {message.metadata?.name || message.metadata?.file_name || (message.text || "").split('/').pop()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-bold text-white/40 uppercase bg-black/20 px-1.5 py-0.5 rounded-md">
                                            {message.metadata?.name?.split('.').pop() || message.text?.split('.').pop() || 'Fayl'}
                                        </p>
                                        <p className="text-[10px] font-bold text-white/40 uppercase">{formatFileSize(message.metadata?.size)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : message.type === 'lesson_start' ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                <p className="text-sm leading-relaxed font-semibold text-white">
                                    {renderText()}
                                </p>
                                <button
                                    onClick={() => {
                                        const sessionId = message.metadata?.sessionId || message.metadata?.chatId || message.parentId || message.id;
                                        window.location.href = `/messages?room=${sessionId}`;
                                    }}
                                    className="mt-2 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Darsga qo'shilish
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <p className="text-sm leading-relaxed">{renderText()}</p>
                                {translatedText && (
                                    <div className="mt-1 pt-1 border-t border-white/10 text-[13px] text-white/90 italic">
                                        {translatedText}
                                    </div>
                                )}
                                {isTranslating && (
                                    <div className="mt-1 text-[10px] text-white/50 animate-pulse">Tarjima qilinmoqda...</div>
                                )}
                                {translationError && (
                                    <div className="mt-1 text-[10px] text-red-400">Tarjimada xatolik yuz berdi.</div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Reactions row */}
                    {(message as any).reactions && Object.keys((message as any).reactions || {}).length > 0 && (
                        <div className="flex flex-wrap gap-1 px-1 mt-1">
                            {Object.values((message as any).reactions).map((r: any) => (
                                r.users && r.users.length > 0 && (
                                    <span
                                        key={r.emoji}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/80"
                                    >
                                        <span>{r.emoji}</span>
                                        <span className="text-[9px] font-semibold">{r.users.length}</span>
                                    </span>
                                )
                            ))}
                        </div>
                    )}
                    {message.type !== 'image' && message.type !== 'video' && (
                        <div className="flex items-center gap-1 px-1 mt-0.5">
                            {message.type === 'text' && (
                                <button
                                    onClick={handleTranslate}
                                    className={`mr-1 text-[10px] font-bold transition-colors ${translatedText ? 'text-blue-400' : 'text-white/30 hover:text-white/60'}`}
                                    title="O'zbek tiliga tarjima qilish"
                                >
                                    A/文
                                </button>
                            )}
                            {onReact && (
                                <div className="flex items-center gap-0.5 mr-1">
                                    {['😃', '👍', '❗'].map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => onReact(emoji)}
                                            className="text-[12px] hover:scale-110 transition-transform"
                                            title="Reaksiya qo'shish"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <span className="text-[9px] text-white/30 font-bold">{message.timestamp}</span>
                            {message.isOwn && (
                                message.isPending ? (
                                    <svg
                                        className="h-3 w-3 text-white/40"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        title="Yuborilmoqda..."
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : message.is_read ? (
                                    <div
                                        className="flex -space-x-1.5 opacity-90"
                                        title="Ko'rildi"
                                    >
                                        <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <svg
                                        className="h-3 w-3 text-white/50"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        title="Yetkazildi"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {contextMenu && (
                <MediaContextMenu
                    x={contextMenu.x} y={contextMenu.y}
                    message={message as any}
                    onClose={() => setContextMenu(null)}
                    onReply={() => onReply?.(message)}
                    onForward={() => onForward?.(message)}
                    onDelete={() => onDelete?.(message)}
                />
            )}
        </div>
    );
};
