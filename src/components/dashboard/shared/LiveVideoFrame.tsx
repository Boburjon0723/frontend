"use client";

import React from 'react';
import {
    useTracks,
    ParticipantTile,
    ControlBar
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoIcon } from 'lucide-react';

interface LiveVideoFrameProps {
    isMentor?: boolean;
}

export function LiveVideoFrame({ isMentor = false }: LiveVideoFrameProps) {
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
        <div className="flex flex-col w-full h-full relative bg-[#0d0f1a] overflow-hidden">
            {/* BIG MAIN VIDEO (Mentor or ScreenShare) */}
            <div className="flex-1 relative overflow-hidden bg-slate-900 group">
                {screenShareTrack ? (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <ParticipantTile trackRef={screenShareTrack} className="w-full h-full object-contain [&>video]:object-contain" />
                    </div>
                ) : mainTrack ? (
                    <ParticipantTile trackRef={mainTrack} className="w-full h-full [&>video]:object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#1a1d2e]">
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 border border-slate-700/50 scale-110">
                            <VideoIcon className="w-10 h-10 opacity-50" />
                        </div>
                        <p className="text-slate-500 font-bold text-sm">
                            {isMentor ? "Kamerangiz o'chirilgan" : "Ustoz ulanishi kutilmoqda..."}
                        </p>
                    </div>
                )}

                {/* Picture in Picture for Screen Share */}
                {screenShareTrack && mainTrack && (
                    <div className="absolute top-4 right-4 w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-slate-900">
                        <ParticipantTile trackRef={mainTrack} className="w-full h-full [&>video]:object-cover" />
                    </div>
                )}
            </div>

            {/* SMALL VIDEOS GRID (Students) */}
            <div className="h-[178px] shrink-0 flex bg-[#0d0f1a] p-2 gap-2 overflow-x-auto no-scrollbar border-t border-white/5">
                {gridTracks.length === 0 ? (
                    <div className="h-full px-8 rounded-xl bg-slate-800/50 border border-white/5 flex flex-col items-center justify-center">
                        <svg className="w-6 h-6 text-slate-600 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        <span className="text-[10px] text-slate-500 font-bold">Talabalar kutilmoqda...</span>
                    </div>
                ) : (
                    gridTracks.map((track, i) => (
                        <div key={track?.participant?.identity || i} className="h-full aspect-video rounded-xl overflow-hidden relative bg-slate-800 shrink-0 ring-1 ring-white/5">
                            {track ? <ParticipantTile trackRef={track} className="w-full h-full [&>video]:object-cover" /> : null}
                            <div className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-md border border-white/5">
                                {track?.participant?.identity || `Talaba ${i + 1}`}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Control Bar for generic controls if needed */}
            {!isMentor && (
                <div className="absolute top-4 left-4 z-[100] px-4 py-2 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                    <ControlBar variation="minimal" />
                </div>
            )}
        </div>
    );
}
