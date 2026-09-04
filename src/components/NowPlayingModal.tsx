import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Sliders,
  ListMusic,
  Mic2,
  Sparkles,
  Disc3,
  Moon,
  Trash2,
  Music2,
  Gauge,
  Tv,
  ExternalLink
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from '../utils/formatters';
import { AudioVisualizer } from './AudioVisualizer';
import { LyricsViewer } from './LyricsViewer';
import { DownloadButton } from './DownloadButton';

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    playbackRate,
    visualizerMode,
    sleepTimer,
    queue,
    queueIndex,
    isNowPlayingExpanded,
    setIsNowPlayingExpanded,
    setIsEqualizerOpen,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    cycleRepeatMode,
    toggleShuffle,
    setPlaybackRate,
    setVisualizerMode,
    setSleepTimerMinutes,
    cancelSleepTimer,
    toggleFavorite,
    isFavorite,
    removeFromQueue,
    clearQueue,
    playTrack
  } = useMusicPlayer();

  const [activeTab, setActiveTab] = useState<'visuals' | 'lyrics' | 'queue' | 'video'>('visuals');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [isVinylMode, setIsVinylMode] = useState(false);

  if (!isNowPlayingExpanded || !currentTrack) return null;

  const favorited = isFavorite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const playbackRates = [0.75, 1.0, 1.25, 1.5, 2.0];
  const sleepTimerOptions = [15, 30, 45, 60];

  // Resolve YouTube Video ID or fallback search
  const ytVideoId = currentTrack.youtubeVideoId || (currentTrack.source === 'youtube' ? currentTrack.id.replace('yt-', '') : null);

  return (
    <div
      id="now-playing-fullscreen-modal"
      className="fixed inset-0 z-50 flex flex-col bg-[#050505]/98 backdrop-blur-3xl text-[#E0E0E0] overflow-y-auto animate-in slide-in-from-bottom duration-300 font-sans"
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none filter blur-3xl"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, #F27D26 0%, transparent 60%), radial-gradient(circle at 80% 80%, #D4AF37 0%, transparent 50%)`
        }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between p-4 md:p-8">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between">
          <button
            id="collapse-now-playing-btn"
            onClick={() => setIsNowPlayingExpanded(false)}
            aria-label="Collapse player"
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Center Tabs: Visuals, Lyrics, Video, Queue */}
          <div className="flex items-center gap-1 bg-[#111111] border border-white/10 p-1 rounded-full overflow-x-auto max-w-[70vw] sm:max-w-none">
            <button
              onClick={() => setActiveTab('visuals')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'visuals'
                  ? 'bg-[#F27D26] text-black shadow-md shadow-[#F27D26]/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Visuals
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'lyrics'
                  ? 'bg-[#F27D26] text-black shadow-md shadow-[#F27D26]/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              Lyrics
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'video'
                  ? 'bg-[#F27D26] text-black shadow-md shadow-[#F27D26]/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Music Video
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'queue'
                  ? 'bg-[#F27D26] text-black shadow-md shadow-[#F27D26]/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              Queue ({queue.length})
            </button>
          </div>

          {/* Quick Equalizer Button */}
          <button
            id="open-eq-btn-fullscreen"
            onClick={() => setIsEqualizerOpen(true)}
            aria-label="Open Equalizer"
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-[#F27D26] transition"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

        {/* Center Dynamic Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center my-6 min-h-[340px]">
          {activeTab === 'visuals' && (
            <div className="flex flex-col items-center justify-center w-full max-w-md">
              {/* Album Art with Vinyl / Standard Toggle */}
              <div className="relative group flex items-center justify-center mb-6">
                {isVinylMode ? (
                  <div className={`relative w-64 h-64 rounded-full bg-[#080808] border-4 border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.9)] p-2 flex items-center justify-center ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
                    <div className="absolute inset-4 rounded-full border border-white/5" />
                    <div className="absolute inset-10 rounded-full border border-white/5" />
                    <div className="absolute inset-16 rounded-full border border-white/5" />
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#F27D26] shadow-inner">
                      <img
                        src={currentTrack.artwork}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute w-6 h-6 rounded-full bg-[#111111] border border-white/10" />
                  </div>
                ) : (
                  <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#111111]">
                    <img
                      src={currentTrack.artwork}
                      alt={currentTrack.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                    />
                    {currentTrack.isLiveRadio && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        LIVE RADIO
                      </div>
                    )}
                    {currentTrack.source === 'youtube' && (
                      <button
                        onClick={() => setActiveTab('video')}
                        className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        Watch Video
                      </button>
                    )}
                  </div>
                )}

                {/* Vinyl Mode Toggle Floating Button */}
                <button
                  onClick={() => setIsVinylMode(!isVinylMode)}
                  title="Toggle Vinyl Record Mode"
                  className="absolute bottom-2 right-2 p-2 rounded-full bg-black/80 hover:bg-black border border-white/10 text-white/70 hover:text-white backdrop-blur shadow-lg transition"
                >
                  <Disc3 className={`w-4 h-4 ${isVinylMode ? 'text-[#F27D26] animate-spin' : ''}`} />
                </button>
              </div>

              {/* Dynamic Audio Visualizer */}
              <div className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-3 flex flex-col gap-2 backdrop-blur-sm shadow-xl">
                <div className="flex items-center justify-between text-[11px] text-white/40 px-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#F27D26]" />
                    Live Spectrum
                  </span>
                  {/* Visualizer Mode selector */}
                  <div className="flex items-center gap-1 bg-[#161616] p-0.5 rounded-lg border border-white/5">
                    {(['bars', 'wave', 'circle', 'neon'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setVisualizerMode(m)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold capitalize transition ${
                          visualizerMode === m
                            ? 'bg-[#F27D26] text-black font-bold'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <AudioVisualizer mode={visualizerMode} isPlaying={isPlaying} accentColor="#F27D26" className="w-full h-16" />
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-3xl p-4 flex flex-col gap-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Official HD Music Video</span>
                </div>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentTrack.artist + ' ' + currentTrack.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white/40 hover:text-[#F27D26] flex items-center gap-1 transition"
                >
                  <span>Open in YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                {ytVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&enablejsapi=1&rel=0`}
                    title={`${currentTrack.artist} - ${currentTrack.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(currentTrack.artist + ' ' + currentTrack.title + ' official video')}&autoplay=1`}
                    title={`${currentTrack.artist} - ${currentTrack.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                )}
              </div>

              <p className="text-xs text-white/40 text-center font-mono">
                Full-length high definition playback streaming directly via YouTube HD
              </p>
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="w-full max-w-lg">
              <LyricsViewer track={currentTrack} currentTime={currentTime} />
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl p-4 flex flex-col gap-3 max-h-[420px] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider font-mono">Up Next ({queue.length} Tracks)</span>
                <button
                  onClick={clearQueue}
                  className="text-xs text-white/40 hover:text-rose-400 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
                {queue.map((t, idx) => {
                  const isCurrent = t.id === currentTrack.id;
                  return (
                    <div
                      key={`${t.id}-${idx}`}
                      onClick={() => playTrack(t)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                        isCurrent
                          ? 'bg-[#18120c] border border-[#F27D26]/40 text-white'
                          : 'hover:bg-white/5 text-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-4 text-xs text-white/30 font-mono">{idx + 1}</span>
                        <img src={t.artwork} alt={t.title} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${isCurrent ? 'text-[#F27D26] font-serif italic' : 'text-white'}`}>
                            {t.title}
                          </p>
                          <p className="text-[11px] text-white/40 truncate">{t.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/30 font-mono">
                          {t.isLiveRadio ? 'LIVE' : formatTime(t.duration)}
                        </span>
                        {queue.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(idx);
                            }}
                            className="p-1 text-white/40 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Track Title & Controls Bottom Section */}
        <div className="w-full max-w-xl mx-auto flex flex-col gap-5">
          {/* Song Metadata & Favorite */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <h2 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm md:text-base text-white/50 truncate font-sans">
                {currentTrack.artist} • <span className="text-white/30">{currentTrack.album || 'Free Stream'}</span>
              </p>
            </div>
            <DownloadButton variant="modal" track={currentTrack} />
            <button
              onClick={() => toggleFavorite(currentTrack)}
              aria-label="Favorite song"
              className={`p-3 rounded-full border transition ${
                favorited
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              <Heart className={`w-6 h-6 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Timeline Scrub Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="relative flex items-center group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                disabled={currentTrack.isLiveRadio}
                onChange={(e) => seek(parseFloat(e.target.value))}
                aria-label="Track progress"
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#F27D26] group-hover:h-2.5 transition-all"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-white/40 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{currentTrack.isLiveRadio ? 'LIVE' : formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="flex items-center justify-between px-2">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              title={isShuffled ? 'Shuffle: ON' : 'Shuffle: OFF'}
              className={`p-2.5 rounded-full transition ${
                isShuffled ? 'text-[#F27D26] bg-[#F27D26]/20 border border-[#F27D26]/30' : 'text-white/40 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* 10s Rewind */}
            <button
              onClick={() => seek(Math.max(0, currentTime - 10))}
              title="Rewind 10 seconds"
              className="p-2 text-white/40 hover:text-white transition"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Previous Track */}
            <button
              onClick={previousTrack}
              title="Previous Track"
              className="p-3 text-white/70 hover:text-white transition transform hover:scale-110 active:scale-95"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            {/* Play / Pause Big Button */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-16 h-16 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black flex items-center justify-center shadow-xl shadow-[#F27D26]/30 transform transition hover:scale-105 active:scale-95 font-bold"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={nextTrack}
              title="Next Track"
              className="p-3 text-white/70 hover:text-white transition transform hover:scale-110 active:scale-95"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            {/* 10s Forward */}
            <button
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              title="Forward 10 seconds"
              className="p-2 text-white/40 hover:text-white transition"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Repeat Mode */}
            <button
              onClick={cycleRepeatMode}
              title={`Repeat: ${repeatMode}`}
              className={`p-2.5 rounded-full transition ${
                repeatMode !== 'off' ? 'text-[#F27D26] bg-[#F27D26]/20 border border-[#F27D26]/30' : 'text-white/40 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Secondary Controls: Volume & Speed & Sleep Timer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {/* Volume Control */}
            <div className="flex items-center gap-2 w-40">
              <button
                onClick={toggleMute}
                aria-label="Toggle mute"
                className="text-white/40 hover:text-white transition"
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

            {/* Right Tools: Speed & Sleep Timer */}
            <div className="flex items-center gap-3">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  title="Playback Speed"
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/70 hover:text-white flex items-center gap-1 transition"
                >
                  <Gauge className="w-3 h-3 text-[#F27D26]" />
                  <span>{playbackRate}x</span>
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 p-1.5 rounded-2xl bg-[#111111] border border-white/15 shadow-2xl flex flex-col gap-1 z-30 min-w-[100px]">
                    <span className="text-[10px] text-white/40 font-mono px-2 py-1">Speed</span>
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setShowSpeedMenu(false);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-mono text-left transition ${
                          playbackRate === rate
                            ? 'bg-[#F27D26] text-black font-bold'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sleep Timer */}
              <div className="relative">
                <button
                  onClick={() => setShowSleepMenu(!showSleepMenu)}
                  title="Sleep Timer"
                  className={`p-2 rounded-full border transition flex items-center gap-1.5 text-xs font-mono ${
                    sleepTimer.active
                      ? 'bg-[#F27D26]/20 border-[#F27D26]/40 text-[#F27D26]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  {sleepTimer.active && (
                    <span>{Math.ceil(sleepTimer.remainingSeconds / 60)}m</span>
                  )}
                </button>
                {showSleepMenu && (
                  <div className="absolute bottom-full right-0 mb-2 p-2 rounded-2xl bg-[#111111] border border-white/15 shadow-2xl flex flex-col gap-1 z-30 min-w-[140px]">
                    <span className="text-[10px] text-white/40 font-mono px-2 py-0.5">Sleep Timer</span>
                    {sleepTimerOptions.map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setSleepTimerMinutes(mins);
                          setShowSleepMenu(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs text-left text-white/70 hover:bg-white/10 hover:text-white font-mono transition"
                      >
                        {mins} minutes
                      </button>
                    ))}
                    {sleepTimer.active && (
                      <button
                        onClick={() => {
                          cancelSleepTimer();
                          setShowSleepMenu(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs text-left text-rose-400 hover:bg-rose-500/10 font-mono transition mt-1 border-t border-white/10"
                      >
                        Turn Off Timer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

