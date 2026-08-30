import React from 'react';
import { Sparkles, Play, Flame, Radio, Compass, Disc, Heart, Plus, Music2, Headphones, Tv, Trophy } from 'lucide-react';
import { CURATED_TRACKS, BOLLYWOOD_TOP_HITS, ENGLISH_TOP_HITS, LIVE_RADIO_STATIONS, BOLLYWOOD_RETRO_CLASSICS, PUNJABI_SUPERHITS } from '../data/curatedTracks';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { TrackCard } from './TrackCard';
import { TrackRow } from './TrackRow';
import { EnglishTop100Section } from './EnglishTop100Section';
import { Track } from '../types';

interface HomeDiscoverViewProps {
  onOpenPlaylistModal: (track?: Track) => void;
}

export const HomeDiscoverView: React.FC<HomeDiscoverViewProps> = ({ onOpenPlaylistModal }) => {
  const { playTrack, currentTrack, isPlaying, setActiveTab, playlists } = useMusicPlayer();

  const featuredTrack = BOLLYWOOD_TOP_HITS[0];

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Featured Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl p-6 sm:p-8 md:p-10">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center filter blur-xl pointer-events-none"
          style={{ backgroundImage: `url(${featuredTrack.artwork})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f08] via-black/80 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30 text-xs font-semibold uppercase tracking-wider w-fit mx-auto md:mx-0">
              <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-ping" />
              Full-Length HD Stream • YouTube Music & Live
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif italic text-white tracking-tight leading-tight">
              {featuredTrack.title}
            </h1>
            <p className="text-sm text-white/50 leading-relaxed">
              Experience full-length playback of the biggest chartbuster by <span className="font-serif italic text-white text-base">{featuredTrack.artist}</span> • {featuredTrack.album}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
              <button
                id="hero-play-btn"
                onClick={() => playTrack(featuredTrack, BOLLYWOOD_TOP_HITS)}
                className="px-6 py-3 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black font-bold text-sm shadow-xl shadow-[#F27D26]/20 flex items-center gap-2 transform transition hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                Play Full Song
              </button>
              <button
                onClick={() => onOpenPlaylistModal(featuredTrack)}
                className="px-4 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition"
              >
                + Add to Playlist
              </button>
            </div>
          </div>

          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group">
            <img
              src={featuredTrack.artwork}
              alt={featuredTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-xs font-serif italic text-white/80 truncate">{featuredTrack.album}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bollywood Top Hits Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-[#F27D26] rounded-full" />
            <h2 className="text-lg md:text-xl font-serif italic text-white flex items-center gap-2">
              <span>🪕 Bollywood & Desi Chartbusters</span>
              <span className="text-xs font-sans not-italic px-2.5 py-0.5 rounded-full bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30">Full Length</span>
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs text-[#F27D26] hover:text-[#ff9944] font-medium tracking-wide"
          >
            Search More Hits →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BOLLYWOOD_TOP_HITS.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              trackList={BOLLYWOOD_TOP_HITS}
              onOpenAddToPlaylist={() => onOpenPlaylistModal(track)}
            />
          ))}
        </div>
      </div>

      {/* Top 100 All-Time English Hits Full Interactive Section */}
      <EnglishTop100Section onOpenPlaylistModal={onOpenPlaylistModal} />

      {/* Punjabi Superhits Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
            <h2 className="text-lg md:text-xl font-serif italic text-white flex items-center gap-2">
              <span>🔥 Punjabi Beats & Superhits</span>
              <span className="text-xs font-sans not-italic px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">320 kbps HD</span>
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium tracking-wide"
          >
            Explore Punjabi →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {PUNJABI_SUPERHITS.slice(0, 8).map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              trackList={PUNJABI_SUPERHITS}
              onOpenAddToPlaylist={() => onOpenPlaylistModal(track)}
            />
          ))}
        </div>
      </div>

      {/* Bollywood Retro Classics Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
            <h2 className="text-lg md:text-xl font-serif italic text-white flex items-center gap-2">
              <span>📻 Bollywood Retro & Golden Era (70s-90s)</span>
              <span className="text-xs font-sans not-italic px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Evergreen</span>
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium tracking-wide"
          >
            Explore Retro →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BOLLYWOOD_RETRO_CLASSICS.slice(0, 8).map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              trackList={BOLLYWOOD_RETRO_CLASSICS}
              onOpenAddToPlaylist={() => onOpenPlaylistModal(track)}
            />
          ))}
        </div>
      </div>

      {/* 24/7 Live Radio Quick Row */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
            <h2 className="text-lg md:text-xl font-serif italic text-white flex items-center gap-2">
              <span>📻 24/7 Bollywood & Top 40 Live Radio</span>
              <span className="text-xs font-sans not-italic px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Live Streams</span>
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('radio')}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium tracking-wide"
          >
            View All Radios ({LIVE_RADIO_STATIONS.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LIVE_RADIO_STATIONS.slice(0, 4).map((station) => (
            <TrackCard
              key={station.id}
              track={station}
              trackList={LIVE_RADIO_STATIONS}
              onOpenAddToPlaylist={() => onOpenPlaylistModal(station)}
            />
          ))}
        </div>
      </div>

      {/* Featured Mood Playlists */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-white/40 rounded-full" />
            <h2 className="text-lg md:text-xl font-serif italic text-white">
              Curated Mood Playlists
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('library')}
            className="text-xs text-white/50 hover:text-white font-medium"
          >
            View Collection →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                if (pl.tracks.length > 0) {
                  playTrack(pl.tracks[0], pl.tracks);
                }
              }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#111111] hover:bg-[#161616] border border-white/5 hover:border-white/15 transition cursor-pointer group"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#1a1a1a] flex-shrink-0 shadow-md border border-white/5">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-white/30">
                    <Disc className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-serif italic text-base text-white group-hover:text-[#F27D26] transition truncate">
                  {pl.name}
                </h3>
                <p className="text-xs text-white/40 line-clamp-2 mt-0.5">
                  {pl.description || 'Collection of great tracks'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-[#F27D26] font-medium">
                  <span className="font-mono">{pl.tracks.length} tracks</span>
                  <span className="text-white/20">•</span>
                  <span className="text-white/40">Free Full Playback</span>
                </div>
              </div>

              <button
                className="w-10 h-10 rounded-full bg-[#F27D26] text-black flex items-center justify-center shadow-lg shadow-[#F27D26]/20 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition duration-200"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

