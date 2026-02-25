'use client';

import React, { useEffect, useRef } from 'react';

interface MediaContextMenuProps {
    x: number;
    y: number;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    message: any;
    onClose: () => void;
    onReply?: () => void;
    onForward?: () => void;
    onDelete?: () => void;
}

export default function MediaContextMenu({
    x, y, mediaUrl, mediaType, message, onClose, onReply, onForward, onDelete
}: MediaContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    // Adjust position so menu stays in viewport
    const adjustedY = typeof window !== 'undefined' && y + 320 > window.innerHeight ? y - 280 : y;
    const adjustedX = typeof window !== 'undefined' && x + 260 > window.innerWidth ? x - 240 : x;

    const handleSaveAs = () => {
        const a = document.createElement('a');
        a.href = mediaUrl;
        a.download = mediaUrl.split('/').pop() || 'media';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onClose();
    };

    const handleCopyImage = async () => {
        try {
            const res = await fetch(mediaUrl);
            const blob = await res.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
        } catch {
            // fallback: just copy URL
            navigator.clipboard.writeText(mediaUrl);
        }
        onClose();
    };

    const handleOpenFull = () => {
        window.open(mediaUrl, '_blank');
        onClose();
    };

    const menuItems = [
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h1M3 14h1m16-4h1m-1 4h1M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
            ),
            label: 'Javob berish',
            action: () => { onReply?.(); onClose(); },
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            label: 'Yuboruvchini ko\'rish',
            action: () => { handleOpenFull(); },
        },
        ...(mediaType === 'image' ? [{
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            label: 'Rasmni nusxa olish',
            action: handleCopyImage,
        }] : []),
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            ),
            label: 'Saqlash',
            action: handleSaveAs,
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            ),
            label: 'Katta ekranda ochish',
            action: handleOpenFull,
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            ),
            label: 'Yuborish (Forward)',
            action: () => { onForward?.(); onClose(); },
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            label: 'O\'chirish',
            labelClass: 'text-red-400',
            action: () => { onDelete?.(); onClose(); },
        },
    ];

    return (
        <div
            className="fixed z-[9999] pointer-events-none"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div
                ref={menuRef}
                className="absolute pointer-events-auto"
                style={{ top: adjustedY, left: adjustedX }}
            >
                {/* Glass menu card */}
                <div
                    className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 min-w-[220px]"
                    style={{
                        background: 'rgba(28, 31, 44, 0.96)',
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                    }}
                >
                    {menuItems.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {idx === menuItems.length - 1 && (
                                <div className="h-px bg-white/10 mx-3" />
                            )}
                            <button
                                onClick={item.action}
                                className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-white/8 active:bg-white/12 transition-colors text-left group"
                                style={{ background: 'transparent' }}
                            >
                                <span className={`flex-shrink-0 ${item.labelClass ? 'text-red-400' : 'text-white/60'} group-hover:text-white transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className={`text-[14px] font-medium ${item.labelClass || 'text-white/85'}`}>
                                    {item.label}
                                </span>
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
