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
}

interface MessageBubbleProps {
    message: Message;
    onReply?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReply }) => {
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
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
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

    return (
        <>
            <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4 group relative`}>
                {/* Reply Action Button (Desktop Hover) */}
                {onReply && (
                    <button
                        onClick={() => onReply(message)}
                        className={`
                        absolute top-2 p-1.5 rounded-full bg-[#535e6c] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10
                        ${message.isOwn ? '-left-10' : '-right-10'}
                    `}
                        title="Reply"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                )}

                <div className={`max-w-[70%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {/* Sender name for group chats */}
                    {!message.isOwn && message.senderName && (
                        <div className="flex items-center gap-2 px-4">
                            <span className="text-xs text-white/60 font-medium">{message.senderName}</span>
                            {message.isAdmin && (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                                    Admin
                                </span>
                            )}
                        </div>
                    )}

                    {/* Message bubble */}
                    <div
                        className={`
                        relative shadow-sm overflow-hidden min-w-[60px]
                        ${message.type === 'image' || message.type === 'video'
                                ? 'rounded-[20px] bg-[#788296]/10'
                                : 'px-4 py-3 rounded-[20px]'
                            }
                        ${message.isOwn
                                ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white ${message.type === 'image' || message.type === 'video' ? '' : 'rounded-br-[4px]'}`
                                : `bg-[#788296]/25 backdrop-blur-[20px] text-white border border-white/20 ${message.type === 'image' || message.type === 'video' ? '' : 'rounded-bl-[4px]'}`
                            }
                    `}
                    >
                        {message.type === 'transaction' ? (
                            <div className="flex flex-col items-start gap-1 min-w-[150px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    <span className="font-bold text-emerald-400 text-sm">Transaction</span>
                                </div>
                                <p className="text-[15px] leading-relaxed tracking-wide font-medium">{message.text}</p>
                                <div className="w-full h-px bg-white/10 my-1"></div>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest">Completed</p>
                            </div>
                        ) : message.type === 'image' ? (
                            <div
                                className="relative group/img overflow-hidden min-w-[260px] min-h-[160px] flex items-center justify-center bg-black/5"
                                onContextMenu={handleMediaContextMenu}
                            >
                                <img
                                    src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/${message.text}`}
                                    alt="Rasm"
                                    className="w-full max-h-[550px] object-cover cursor-pointer hover:scale-[1.01] transition-transform duration-500"
                                    onClick={() => window.open(message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/${message.text}`, '_blank')}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.parentElement!.innerHTML = `
                                        <div class="flex flex-col items-center justify-center p-8 text-white/40 gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span class="text-xs font-medium">Rasm yuklanmadi</span>
                                        </div>
                                    `;
                                    }}
                                />
                                {/* Premium Overlaid Status Pill */}
                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 select-none z-10 shadow-lg">
                                    <span className="text-[10px] font-bold text-white/90 tracking-tight">{message.timestamp}</span>
                                    {message.isOwn && (
                                        <div className="flex items-center -space-x-1.5 translate-y-[0.5px]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : message.type === 'video' ? (
                            <div
                                className="relative group/vid overflow-hidden min-w-[260px] min-h-[160px] flex items-center justify-center bg-black"
                                onContextMenu={handleMediaContextMenu}
                            >
                                <video
                                    src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/${message.text}`}
                                    className="w-full max-h-[550px] object-cover"
                                    controls
                                    playsInline
                                />
                                {/* Overlaid Status Pill */}
                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 select-none z-10 shadow-lg pointer-events-none">
                                    <span className="text-[10px] font-bold text-white/90 tracking-tight">{message.timestamp}</span>
                                    {message.isOwn && (
                                        <div className="flex items-center -space-x-1.5 translate-y-[0.5px]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : message.type === 'voice' ? (
                            <div className="flex flex-col gap-2 min-w-[240px] py-1">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={togglePlay}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${message.isOwn ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'}`}
                                    >
                                        {isPlaying ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>
                                    <div className="flex-1 space-y-1.5 pt-1">
                                        <div
                                            className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer group/progress relative"
                                            onClick={handleProgressClick}
                                        >
                                            <div
                                                className={`h-full ${message.isOwn ? 'bg-white' : 'bg-blue-500'} transition-all duration-100 relative`}
                                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                            >
                                                <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity ${message.isOwn ? 'bg-white' : 'bg-blue-500'}`}></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center px-0.5">
                                            <audio
                                                ref={audioRef}
                                                src={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/${message.text}`}
                                                className="hidden"
                                            />
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Voice Message</span>
                                            <span className="text-[10px] font-mono text-white/50">{formatDuration(isPlaying ? currentTime : duration)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : message.type === 'file' ? (
                            <div className="flex items-center gap-4 py-2 px-1 min-w-[220px]">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${message.isOwn ? 'bg-white/20' : 'bg-blue-500/20'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${message.isOwn ? 'text-white' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-bold truncate pr-2" title={message.text.split('/').pop()}>
                                        {message.text.split('/').pop()}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <a
                                            href={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/${message.text}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`text-[10px] font-bold uppercase tracking-widest hover:opacity-80 flex items-center gap-1 ${message.isOwn ? 'text-white' : 'text-blue-400'}`}
                                            download
                                        >
                                            <span>Yuklab olish</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </a>
                                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span className="text-[9px] font-bold text-white/30 uppercase">
                                            {message.text.split('.').pop()?.toUpperCase() || 'FILE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[15px] leading-relaxed tracking-wide font-normal">{message.text}</p>
                        )}
                    </div>

                    {/* Timestamp & Status (Hidden for images since it's overlaid) */}
                    {message.type !== 'image' && (
                        <div className="flex items-center justify-end gap-1 px-1 mt-1">
                            <span className="text-[11px] text-white/40 font-medium">{message.timestamp}</span>
                            {message.isOwn && (
                                <div className="flex items-center -space-x-1.5 translate-y-[0.5px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu for image/video */}
            {contextMenu && (message.type === 'image' || message.type === 'video') && (
                <MediaContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    mediaUrl={message.text.startsWith('http') ? message.text : `${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/${message.text}`}
                    mediaType={message.type as 'image' | 'video'}
                    message={message}
                    onClose={() => setContextMenu(null)}
                    onReply={() => { onReply?.(message); setContextMenu(null); }}
                />
            )}
        </>
    );
};
