"use client";

import React from 'react';
import {
    useTracks,
    ParticipantTile,
    ControlBar
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoIcon, Users } from 'lucide-react';
import { LiveWhiteboard } from './LiveWhiteboard';

interface LiveVideoFrameProps {
    isMentor?: boolean;
    isWhiteboardOpen?: boolean;
    socket?: any;
    sessionId?: string;
    onCloseWhiteboard?: () => void;
    immersive?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-ad05.up.railway.app';
const getAvatarUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export function LiveVideoFrame({
    isMentor = false,
    isWhiteboardOpen = false,
    socket,
    sessionId,
    onCloseWhiteboard,
    immersive = false
}: LiveVideoFrameProps) {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    const localVideoTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.Camera);
    const remoteVideoTracks = tracks.filter(t => !t.participant.isLocal && t.source === Track.Source.Camera);

    // Main Track (Always Mentor)
    const mainTrack = isMentor ? localVideoTrack : (remoteVideoTracks.length > 0 ? remoteVideoTracks[0] : null);

    // Grid Tracks (Always Students)
    const gridTracks = isMentor
        ? remoteVideoTracks
        : [localVideoTrack, ...remoteVideoTracks.slice(1)].filter(Boolean); // Remote 0 is assume mentor for student

    const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare);

    return (
        <div className={`flex flex-col w-full h-full relative ${immersive ? 'bg-black' : 'bg-[#0d0f1a]'} overflow-hidden`}>

            {(isWhiteboardOpen || screenShareTrack) ? (
                // --- SCREEN SHARE / WHITEBOARD ACTIVE MODE ---
                <div className="flex-1 flex flex-row overflow-hidden w-full h-full">
                    <div className="flex-1 h-full bg-black relative flex items-center justify-center p-2">
                        {isWhiteboardOpen && socket && sessionId ? (
                            <LiveWhiteboard socket={socket} sessionId={sessionId} isMentor={isMentor} onClose={onCloseWhiteboard} />
                        ) : screenShareTrack ? (
                            <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                <ParticipantTile trackRef={screenShareTrack!} className="w-full h-full object-contain [&>video]:object-contain" />
                            </div>
                        ) : null}
                    </div>

                    <div className="w-64 shrink-0 h-full bg-[#11131a] border-l border-white/5 flex flex-col p-3 gap-3 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-bold text-white/50 uppercase tracking-wide mb-1 px-1">Qatnashchilar</div>
                        {mainTrack && (
                            <div className="w-full aspect-video rounded-xl overflow-hidden relative bg-slate-800 shrink-0 ring-1 ring-white/10 shadow-lg">
                                <ParticipantTile trackRef={mainTrack} className="w-full h-full [&>video]:object-cover" />
                                <div className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-md border border-white/10">
                                    {isMentor ? "Siz (Mentor)" : "Mentor"}
                                </div>
                            </div>
                        )}
                        {gridTracks.map((track, i) => (
                            <div key={track?.participant?.identity || i} className="w-full aspect-video rounded-xl overflow-hidden relative bg-slate-800 border border-slate-700/50 shrink-0">
                                {track ? <ParticipantTile trackRef={track} className="w-full h-full [&>video]:object-cover" /> : null}
                                <div className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white/90 bg-slate-900/80 px-2 py-0.5 rounded-lg backdrop-blur-sm shadow-sm">
                                    {track?.participant?.identity || `Talaba ${i + 1}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : immersive ? (
                // --- IMMERSIVE THEATRE MODE ---
                <div className="flex-1 relative w-full h-full overflow-hidden bg-black">
                    {/* Main Background Video (Mentor) */}
                    <div className="absolute inset-0 z-0">
                        {mainTrack ? (
                            <ParticipantTile trackRef={mainTrack} className="w-full h-full [&>video]:object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0a0b10]">
                                {(() => {
                                    const participant = tracks.find(t => isMentor ? t.participant.isLocal : (!t.participant.isLocal))?.participant;
                                    let avatar = null;
                                    if (participant?.metadata) {
                                        try {
                                            const meta = JSON.parse(participant.metadata);
                                            avatar = meta.avatar_url || meta.avatar;
                                        } catch (e) { }
                                    }
                                    return (
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl">
                                            {avatar ? (
                                                <img src={getAvatarUrl(avatar)!} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20">
                                                    <VideoIcon className="w-12 h-12" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                <p className="text-white/40 font-bold text-sm tracking-widest uppercase">
                                    {isMentor ? "Kamerangiz o'chirilgan" : "Ustoz ulanishi kutilmoqda..."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Floating PiP Window (Self/Others) */}
                    <div className="absolute bottom-24 right-8 z-10 flex flex-col gap-4 items-end">
                        {gridTracks.slice(0, 3).map((track, i) => (
                            <div key={track?.participant?.identity || i} className="w-48 aspect-video rounded-2xl overflow-hidden relative bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl transition-all hover:scale-105 group">
                                {track ? <ParticipantTile trackRef={track} className="w-full h-full [&>video]:object-cover" /> : null}
                                <div className="absolute bottom-2 left-2 text-[9px] font-black text-white bg-black/60 px-2 py-1 rounded-lg backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {track?.participant?.identity || `Talaba ${i + 1}`}
                                </div>
                                {track?.participant?.isLocal && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // --- CLASSIC GRID MODE ---
                <>
                    <div className="flex-1 relative overflow-hidden bg-slate-900 group">
                        {mainTrack ? (
                            <ParticipantTile trackRef={mainTrack} className="w-full h-full [&>video]:object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#1a1d2e]">
                                {(() => {
                                    const participant = tracks.find(t => isMentor ? t.participant.isLocal : (!t.participant.isLocal))?.participant;
                                    let avatar = null;
                                    if (participant?.metadata) {
                                        try {
                                            const meta = JSON.parse(participant.metadata);
                                            avatar = meta.avatar_url || meta.avatar;
                                        } catch (e) { }
                                    }
                                    return (
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-slate-700/50 shadow-xl">
                                            {avatar ? (
                                                <img src={getAvatarUrl(avatar)!} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                                                    <VideoIcon className="w-10 h-10 opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                <p className="text-slate-500 font-bold text-sm">
                                    {isMentor ? "Kamerangiz o'chirilgan" : "Ustoz ulanishi kutilmoqda / Kamera o'chiq"}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="h-[178px] shrink-0 flex bg-[#0d0f1a] p-3 gap-3 overflow-x-auto custom-scrollbar border-t border-white/5">
                        {gridTracks.length === 0 ? (
                            <div className="h-full px-8 rounded-xl bg-slate-800/30 border border-white/5 flex flex-col items-center justify-center gap-2">
                                <Users className="w-5 h-5 text-slate-500" />
                                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Talabalar kutilmoqda</span>
                            </div>
                        ) : (
                            gridTracks.map((track, i) => (
                                <div key={track?.participant?.identity || i} className="h-full aspect-video rounded-xl overflow-hidden relative bg-slate-800 shrink-0 ring-1 ring-white/10 shadow-lg">
                                    {track ? <ParticipantTile trackRef={track} className="w-full h-full [&>video]:object-cover" /> : null}
                                    <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/70 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm border border-white/10">
                                        {track?.participant?.identity || `Talaba ${i + 1}`}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Floating Control Bar for generic controls if needed */}
            {!isMentor && !screenShareTrack && !immersive && (
                <div className="absolute top-4 left-4 z-[100] px-4 py-2 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                    <ControlBar variation="minimal" />
                </div>
            )}
        </div>
    );
}
