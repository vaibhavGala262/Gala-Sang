import React, { useEffect, useRef } from 'react';
import { Mic2, Sparkles } from 'lucide-react';
import { Track } from '../types';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from '../utils/formatters';

interface LyricsViewerProps {
  track: Track;
  currentTime: number;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ track, currentTime }) => {
  const { seek } = useMusicPlayer();
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const syncedLyrics = track.syncedLyrics;

  // Find active line
  let activeIndex = -1;
  if (syncedLyrics && syncedLyrics.length > 0) {
    for (let i = syncedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= syncedLyrics[i].time) {
        activeIndex = i;
        break;
      }
    }
  }

  // Smooth auto-scroll to current active lyric line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  if (!syncedLyrics && !track.lyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center px-4 font-sans">
        <div className="w-16 h-16 rounded-full bg-[#F27D26]/10 text-[#F27D26] flex items-center justify-center mb-4 border border-[#F27D26]/20">
          <Mic2 className="w-8 h-8 opacity-80" />
        </div>
        <h4 className="text-base font-serif italic text-white mb-1">Instrumental or Live Stream</h4>
        <p className="text-xs text-white/40 max-w-xs">
          No written lyrics are registered for this track. Enjoy the melody and rhythm.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 py-8 px-4 max-h-[460px] overflow-y-auto scrollbar-none text-center select-none font-sans"
    >
      {syncedLyrics && syncedLyrics.length > 0 ? (
        syncedLyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          return (
            <div
              key={idx}
              ref={isActive ? activeLineRef : null}
              onClick={() => seek(line.time)}
              className={`cursor-pointer transition-all duration-300 py-2 px-5 rounded-2xl ${
                isActive
                  ? 'text-white text-xl md:text-2xl font-serif italic scale-105 bg-[#18120c] border border-[#F27D26]/40 backdrop-blur-md shadow-xl shadow-[#F27D26]/10'
                  : isPassed
                  ? 'text-white/60 text-base md:text-lg font-normal hover:text-white'
                  : 'text-white/20 text-base md:text-lg font-normal hover:text-white/50'
              }`}
            >
              <p className="leading-relaxed">
                {line.text}
              </p>
              {isActive && (
                <span className="text-[10px] text-[#F27D26] font-mono tracking-widest uppercase">
                  {formatTime(line.time)}
                </span>
              )}
            </div>
          );
        })
      ) : (
        <div className="whitespace-pre-line text-white/70 text-base leading-loose font-serif italic">
          {track.lyrics}
        </div>
      )}
    </div>
  );
};
