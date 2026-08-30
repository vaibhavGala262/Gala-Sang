import React, { useState } from 'react';
import { Radio, Play, Pause, Signal, Volume2, Globe, Sparkles, Flame, Music, Headphones } from 'lucide-react';
import { LIVE_RADIO_STATIONS } from '../data/curatedTracks';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { Track } from '../types';

export const RadioStationsView: React.FC = () => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayer();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Stations (24/7)', icon: Radio },
    { id: 'bollywood', label: '🪕 Bollywood & Desi Top Hits', icon: Flame },
    { id: 'english_top40', label: '🌟 English Top 40 Billboard', icon: Music },
    { id: 'chill_lofi', label: '☕ Lo-Fi & Chillout', icon: Headphones },
    { id: 'jazz_classical', label: '🎷 Smooth Jazz & Lounge', icon: Sparkles }
  ];

  const filteredStations = selectedCategory === 'all'
    ? LIVE_RADIO_STATIONS
    : LIVE_RADIO_STATIONS.filter(s => s.radioCategory === selectedCategory);

  const handleStationClick = (station: Track) => {
    if (currentTrack?.id === station.id) {
      togglePlay();
    } else {
      playTrack(station, LIVE_RADIO_STATIONS);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden bg-gradient-to-br from-[#1c1208] via-[#0d0d0d] to-[#050505] border border-[#F27D26]/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono w-fit">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              24/7 Global Live HD Audio Broadcasts
            </div>
            <h2 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">
              Live Bollywood & English Top 40 Radio
            </h2>
            <p className="text-sm text-white/50">
              Commercial-free 24/7 live high-definition broadcasts featuring Radio Mirchi Bollywood hits, UK Capital FM, US Billboard Top 40, BBC Asian Network, and lofi chill streams.
            </p>
          </div>
          <div className="hidden lg:flex items-center justify-center w-20 h-20 rounded-full bg-white/5 text-[#F27D26] border border-white/10 shadow-inner">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition border flex items-center gap-2 ${
              selectedCategory === cat.id
                ? 'bg-[#F27D26] border-[#F27D26] text-black font-semibold shadow-lg shadow-[#F27D26]/20'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStations.map((station) => {
          const isThisActive = currentTrack?.id === station.id;
          const isThisPlaying = isThisActive && isPlaying;

          return (
            <div
              key={station.id}
              id={`radio-card-${station.id}`}
              onClick={() => handleStationClick(station)}
              className={`group relative flex flex-col p-4 rounded-3xl border transition-all duration-300 cursor-pointer ${
                isThisActive
                  ? 'bg-[#18120c] border-[#F27D26]/50 shadow-xl shadow-[#F27D26]/10'
                  : 'bg-[#0e0e0e] hover:bg-[#141414] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Artwork Cover */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#1a1a1a] mb-4 shadow-md border border-white/10">
                <img
                  src={station.artwork}
                  alt={station.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Live Pill */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE HD
                </div>

                {/* Genre Badge */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/80 border border-white/10">
                  {station.genre}
                </div>

                {/* Center Play Button Overlay */}
                <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${
                  isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <button
                    aria-label={isThisPlaying ? 'Pause radio' : 'Play radio'}
                    className="w-14 h-14 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black flex items-center justify-center shadow-xl shadow-[#F27D26]/30 font-bold transform transition hover:scale-110"
                  >
                    {isThisPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Station Info */}
              <div className="flex flex-col gap-1">
                <h3 className={`text-base font-medium truncate group-hover:text-[#F27D26] transition ${
                  isThisActive ? 'text-[#F27D26] font-serif italic' : 'text-white'
                }`}>
                  {station.title}
                </h3>
                <p className="text-xs text-white/40 truncate">
                  {station.artist}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/30 font-mono">
                  <span className="flex items-center gap-1 text-[#F27D26]">
                    <Signal className="w-3 h-3" /> 24/7 Ultra HQ
                  </span>
                  <span>Full Broadcast</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

