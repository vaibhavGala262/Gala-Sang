import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
  Sliders,
  Sparkles,
  Radio
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from '../utils/formatters';
import { AudioVisualizer } from './AudioVisualizer';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    visualizerMode,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    cycleRepeatMode,
    toggleShuffle,
    toggleFavorite,
    isFavorite,
    setIsNowPlayingExpanded,
    setIsEqualizerOpen
  } = useMusicPlayer();

  if (!currentTrack) return null;

  const favorited = isFavorite(currentTrack.id);

  return (
    <div
      id="bottom-player-bar"
      className="fixed bottom-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl transition-all duration-300 left-0 right-0"
    >
      {/* Top Scrub Timeline (Full Width Line) */}
      <div className="relative group w-full h-1 bg-white/10 hover:h-2 transition-all cursor-pointer">
        <div
          className="h-full bg-gradient-to-r from-[#F27D26] via-[#e56b15] to-[#D4AF37]"
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          disabled={currentTrack.isLiveRadio}
          onChange={(e) => seek(parseFloat(e.target.value))}
          aria-label="Seek timeline"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Track Info & Artwork */}
        <div
          onClick={() => setIsNowPlayingExpanded(true)}
          className="flex items-center gap-3 min-w-0 max-w-[280px] md:max-w-xs cursor-pointer group"
        >
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 flex-shrink-0 shadow-md">
            <img
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
                isPlaying ? 'scale-100' : ''
              }`}
            />
            {currentTrack.isLiveRadio && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <h4 className="text-sm font-medium text-white group-hover:text-[#F27D26] transition truncate font-sans">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-white/40 truncate">
              {currentTrack.artist}
            </p>
          </div>

          <button
            id="fav-mini-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentTrack);
            }}
            aria-label="Favorite"
            className={`p-1.5 rounded-full transition ml-1 ${
              favorited ? 'text-rose-500' : 'text-white/30 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Main Playback Controls & Time */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Shuffle (Hidden on small mobile) */}
            <button
              onClick={toggleShuffle}
              title="Shuffle"
              className={`hidden sm:block p-1.5 rounded-full transition ${
                isShuffled ? 'text-[#F27D26] bg-[#F27D26]/15 border border-[#F27D26]/30' : 'text-white/40 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={previousTrack}
              aria-label="Previous track"
              className="p-1.5 text-white/70 hover:text-white transition"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play/Pause Main Button */}
            <button
              id="playerbar-play-toggle-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-11 h-11 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black flex items-center justify-center shadow-lg shadow-[#F27D26]/20 transform transition hover:scale-105 active:scale-95 font-bold"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              aria-label="Next track"
              className="p-1.5 text-white/70 hover:text-white transition"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat (Hidden on small mobile) */}
            <button
              onClick={cycleRepeatMode}
              title={`Repeat: ${repeatMode}`}
              className={`hidden sm:block p-1.5 rounded-full transition ${
                repeatMode !== 'off' ? 'text-[#F27D26] bg-[#F27D26]/15 border border-[#F27D26]/30' : 'text-white/40 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Time display (desktop) */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{currentTrack.isLiveRadio ? 'LIVE' : formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Equalizer, Volume & Fullscreen */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mini Visualizer Preview */}
          <div className="hidden lg:block w-24 h-7 cursor-pointer" onClick={() => setIsNowPlayingExpanded(true)}>
            <AudioVisualizer mode={visualizerMode} isPlaying={isPlaying} accentColor="#F27D26" className="w-full h-full" />
          </div>

          {/* Equalizer trigger */}
          <button
            id="playerbar-eq-btn"
            onClick={() => setIsEqualizerOpen(true)}
            title="Audio Equalizer"
            className="p-2 rounded-full text-white/60 hover:text-[#F27D26] hover:bg-white/5 border border-transparent hover:border-white/10 transition"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Volume Control (Desktop) */}
          <div className="hidden md:flex items-center gap-2 w-28">
            <button
              onClick={toggleMute}
              aria-label="Toggle mute"
              className="text-white/50 hover:text-white transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-full h-1.5 bg-white/10 rounded-lg accent-[#F27D26] cursor-pointer"
            />
          </div>

          {/* Expand Fullscreen */}
          <button
            id="playerbar-expand-btn"
            onClick={() => setIsNowPlayingExpanded(true)}
            title="Open Fullscreen Player"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
