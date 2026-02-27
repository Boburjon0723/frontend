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
}

interface MessageBubbleProps {
    message: Message;
    onReply?: (message: Message) => void;
    isSelecting?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    uploadProgress?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReply, isSelecting, isSelected, onSelect }) => {
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

    return (
        <>
            <div
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4 group relative ${isSelecting ? 'cursor-pointer' : ''}`}
                onClick={() => {
                    if (isSelecting && onSelect) {
                        onSelect();
                    }
                }}
            >
                {/* Selection Overlay & Checkbox */}
                {isSelecting && (
                    <div className={`absolute inset-0 z-10 flex items-center ${message.isOwn ? 'justify-start pl-4' : 'justify-end pr-4'} bg-black/0 hover:bg-white/5 transition-colors rounded-xl`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                            {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                    </div>
                )}

                <div className={`max-w-[75%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1 ${isSelecting ? 'opacity-80' : ''}`}>
                    {!message.isOwn && message.senderName && (
                        <div className="flex items-center gap-2 px-2 mb-0.5">
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{message.senderName}</span>
                        </div>
                    )}

                    <div className={`relative shadow-sm overflow-hidden min-w-[60px] 
                        ${message.type === 'image' || message.type === 'video' ? 'rounded-2xl' : 'px-4 py-3 rounded-2xl'}
                        ${message.isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/10 backdrop-blur-xl text-white border border-white/5 rounded-bl-sm'}
                    `} onContextMenu={isSelecting ? undefined : handleMediaContextMenu}>
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
                                            <div
                                                className="h-full bg-blue-400 transition-all duration-300"
                                                style={{ width: `${uploadProgress || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {message.type === 'image' ? (
                            <div className="relative group/img min-w-[200px]">
                                <img src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} className="w-full max-h-[400px] object-cover rounded-lg" />
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold">{message.timestamp}</div>
                            </div>
                        ) : message.type === 'video' ? (
                            <div className="relative min-w-[200px]">
                                <video src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} className="w-full max-h-[400px] object-cover rounded-lg" controls />
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold">{message.timestamp}</div>
                            </div>
                        ) : message.type === 'voice' ? (
                            <div className="flex items-center gap-3 min-w-[200px]">
                                <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                                    {isPlaying ? <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                                </button>
                                <div className="flex-1">
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1" onClick={handleProgressClick}>
                                        <div className="h-full bg-white" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[8px] opacity-40 uppercase font-bold tracking-tighter">
                                        <span>Voice msg</span>
                                        <span>{formatDuration(isPlaying ? currentTime : duration)}</span>
                                    </div>
                                </div>
                                <audio ref={audioRef} src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} className="hidden" />
                            </div>
                        ) : message.type === 'file' ? (
                            <div className="flex items-center gap-3 py-1 min-w-[200px]">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{message.text.split('/').pop()}</p>
                                    <a href={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${message.text}`} download target="_blank" className="text-[9px] font-bold text-blue-400 uppercase hover:underline">Download</a>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm leading-relaxed">{renderText()}</p>
                        )}
                    </div>
                    {message.type !== 'image' && message.type !== 'video' && (
                        <div className="flex items-center gap-1 px-1">
                            <span className="text-[9px] text-white/30 font-bold">{message.timestamp}</span>
                            {message.isOwn && (
                                <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {contextMenu && (
                <MediaContextMenu
                    x={contextMenu.x} y={contextMenu.y}
                    message={message as any} onClose={() => setContextMenu(null)}
                />
            )}
        </>
    );
};

