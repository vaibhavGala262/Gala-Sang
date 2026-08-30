import React, { useState, useMemo } from 'react';
import { Trophy, Play, Search, LayoutGrid, List, Sparkles, Filter, ChevronDown, ChevronUp, Music2 } from 'lucide-react';
import { Track } from '../types';
import { ENGLISH_TOP_100 } from '../data/curatedTracks';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { TrackCard } from './TrackCard';
import { TrackRow } from './TrackRow';

interface EnglishTop100SectionProps {
  onOpenPlaylistModal: (track: Track) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All 100 Songs', count: 100 },
  { id: 'pop', label: '🌟 Pop & Billboard', filter: (t: Track) => /pop|disco|synth/i.test(t.genre || '') },
  { id: 'edm', label: '⚡ EDM & Dance', filter: (t: Track) => /edm|house|dance|bass/i.test(t.genre || '') || /alan walker|avicii|chainsmokers|marshmello|dj snake|guetta/i.test(t.artist) },
  { id: 'rock', label: '🎸 Rock & Indie', filter: (t: Track) => /rock|indie|alternative/i.test(t.genre || '') || /imagine dragons|coldplay|onerepublic|neighbourhood|glass animals/i.test(t.artist) },
  { id: 'hiphop', label: '🎤 Hip-Hop & R&B', filter: (t: Track) => /hip-hop|r&b|rap|trap|afrobeats/i.test(t.genre || '') || /eminem|drake|juice wrld|post malone|rihanna|beyonc/i.test(t.artist) },
  { id: 'acoustic', label: '🎹 Acoustic & Soul', filter: (t: Track) => /acoustic|soul|ballad|folk|blues/i.test(t.genre || '') || /passenger|tom odell|stephen sanchez|sam smith|hozier|arthur|vance joy/i.test(t.artist) }
];

export const EnglishTop100Section: React.FC<EnglishTop100SectionProps> = ({ onOpenPlaylistModal }) => {
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayLimit, setDisplayLimit] = useState<number>(16);

  const filteredTracks = useMemo(() => {
    let list = ENGLISH_TOP_100;
    if (selectedCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (cat?.filter) {
        list = list.filter(cat.filter);
      }
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, filterQuery]);

  const visibleTracks = useMemo(() => {
    return filteredTracks.slice(0, displayLimit);
  }, [filteredTracks, displayLimit]);

  const handlePlayAll = () => {
    if (filteredTracks.length > 0) {
      playTrack(filteredTracks[0], filteredTracks);
    }
  };

  const toggleDisplayLimit = () => {
    if (displayLimit >= filteredTracks.length) {
      setDisplayLimit(16);
    } else {
      setDisplayLimit(100);
    }
  };

  return (
    <div id="english-top-100-section" className="flex flex-col gap-5 bg-gradient-to-b from-[#12100d] via-[#0d0d0d] to-[#0a0a0a] p-5 sm:p-6 rounded-3xl border border-[#D4AF37]/20 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center shadow-lg shadow-[#D4AF37]/10">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif italic text-white tracking-tight">
                Top 100 All-Time English Hits
              </h2>
              <span className="text-xs font-sans font-semibold not-italic px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                100 / 100 Verified
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              Full-length 320 kbps high fidelity audio • The Weeknd, Ed Sheeran, Alan Walker, Taylor Swift, Coldplay & more
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            id="play-all-english-btn"
            onClick={handlePlayAll}
            className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#e4c256] text-black font-bold text-xs shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5 transition transform active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play All ({filteredTracks.length})
          </button>

          {/* Grid / List switch */}
          <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-xl transition ${
                viewMode === 'grid'
                  ? 'bg-[#D4AF37] text-black font-bold shadow'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-xl transition ${
                viewMode === 'list'
                  ? 'bg-[#D4AF37] text-black font-bold shadow'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Category Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setDisplayLimit(16);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-[#D4AF37] text-black font-bold border-[#D4AF37] shadow-sm'
                  : 'bg-[#141414] text-white/70 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* In-section Search Filter */}
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter English Top 100..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#141414] rounded-full text-xs text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-[#D4AF37]/50 transition"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tracks Display */}
      {filteredTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-[#141414]/50 rounded-2xl border border-white/5">
          <Music2 className="w-8 h-8 text-white/20 mb-2" />
          <p className="text-sm text-white/70">No English songs match &quot;{filterQuery}&quot;</p>
          <button
            onClick={() => { setFilterQuery(''); setSelectedCategory('all'); }}
            className="mt-2 text-xs text-[#D4AF37] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {visibleTracks.map((track, idx) => (
            <div key={track.id} className="relative group">
              {/* Rank Badge */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-[#D4AF37]/30 text-[10px] font-mono font-bold text-[#D4AF37] pointer-events-none shadow-md">
                #{ENGLISH_TOP_100.findIndex(t => t.id === track.id) + 1}
              </div>
              <TrackCard
                track={track}
                trackList={filteredTracks}
                onOpenAddToPlaylist={() => onOpenPlaylistModal(track)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 bg-[#111111] p-3 rounded-2xl border border-white/5">
          {visibleTracks.map((track, idx) => (
            <div key={track.id} className="flex items-center gap-2">
              <span className="w-6 text-center text-xs font-mono font-bold text-[#D4AF37]/80">
                #{ENGLISH_TOP_100.findIndex(t => t.id === track.id) + 1}
              </span>
              <div className="flex-1">
                <TrackRow
                  track={track}
                  index={idx}
                  trackList={filteredTracks}
                  onOpenAddToPlaylist={() => onOpenPlaylistModal(track)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More / Show Less Button */}
      {filteredTracks.length > 16 && (
        <div className="flex justify-center pt-2">
          <button
            id="toggle-show-all-english-btn"
            onClick={toggleDisplayLimit}
            className="px-6 py-2.5 rounded-full bg-[#161616] hover:bg-[#1f1f1f] text-white/80 hover:text-white border border-white/10 hover:border-[#D4AF37]/40 text-xs font-medium flex items-center gap-2 transition"
          >
            {displayLimit >= filteredTracks.length ? (
              <>
                <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                Show Less (Top 16)
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
                Show All {filteredTracks.length} Songs ({filteredTracks.length - displayLimit} more)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
