'use client';

import React, { useState, useRef, useEffect } from 'react';
import MediaContextMenu from './MediaContextMenu';

interface Message {
    id: string;
    text: string;
    timestamp: string;
    isOwn: boolean;
    senderName?: string;
    isAdmin?: boolean;
    type?: string;
    metadata?: any;
    isUploading?: boolean;
    error?: string;
    parentMessage?: any;
    parentId?: string;
    parent_id?: string;
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
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message, onReply, isSelecting, isSelected, onSelect,
    uploadProgress, onMediaClick, onForward, onDelete,
    isContinuation, onReplyClick, activeAudioId, onAudioPlay
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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
        (message.text.toLowerCase().endsWith('.mp3')) ||
        (message.text.toLowerCase().endsWith('.wav')) ||
        (message.text.toLowerCase().endsWith('.m4a')) ||
        (message.text.toLowerCase().endsWith('.ogg'));

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
        const query = (window as any).currentSearchQuery || "";
        if (!query || message.type !== 'text') return message.text;
        const parts = message.text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase()
                        ? <mark key={i} className="bg-yellow-400/80 text-black rounded-sm px-0.5">{part}</mark>
                        : part
                )}
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
                        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-blue-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                            <span className="text-xs font-bold text-blue-400">{(message.senderName || "?")[0].toUpperCase()}</span>
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
                                <img src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} className="w-full max-h-[400px] object-cover rounded-lg" />
                                {message.metadata?.caption && <div className="px-4 py-2 text-sm text-white/90 border-t border-white/5">{message.metadata.caption}</div>}
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold">{message.timestamp}</div>
                            </div>
                        ) : message.type === 'video' ? (
                            <div className="relative min-w-[200px] cursor-pointer group/video" onClick={() => onMediaClick?.(message.text, 'video')}>
                                <video src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} className="w-full max-h-[400px] object-cover rounded-lg" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/20">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <svg className="h-6 w-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                                {message.metadata?.caption && <div className="px-4 py-2 text-sm text-white/90 border-t border-white/5">{message.metadata.caption}</div>}
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold">{message.timestamp}</div>
                            </div>
                        ) : isAudioFile ? (
                            <div className="flex items-center gap-3 min-w-[240px] py-1">
                                <button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                                    {isPlaying ? (
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    ) : (
                                        <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-white truncate mb-0.5">{message.type === 'voice' ? 'Ovozli xabar' : (message.text.split('/').pop() || 'Audio File')}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden" onClick={handleProgressClick}>
                                            <div className="h-full bg-blue-400" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40">{formatDuration(isPlaying ? currentTime : duration)}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-white/30 uppercase mt-1">
                                        {message.type === 'voice' ? 'Voice' : formatFileSize(message.metadata?.size)}
                                    </p>
                                </div>
                                <audio ref={audioRef} src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} className="hidden" />
                            </div>
                        ) : message.type === 'file' ? (
                            <div className="flex items-center gap-4 py-2 min-w-[240px]">
                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-white truncate">{message.text.split('/').pop()}</p>
                                    <p className="text-[11px] font-bold text-white/40 uppercase">{formatFileSize(message.metadata?.size)}</p>
                                    {!message.isUploading && (
                                        <a href={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} download className="text-[10px] font-bold text-blue-400 uppercase mt-1 inline-block">Yuklab olish</a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm leading-relaxed">{renderText()}</p>
                        )}
                    </div>
                    {message.type !== 'image' && message.type !== 'video' && (
                        <div className="flex items-center gap-1 px-1">
                            <span className="text-[9px] text-white/30 font-bold">{message.timestamp}</span>
                            {message.isOwn && <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
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
