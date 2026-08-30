import React, { useState } from 'react';
import { Search, LayoutGrid, List, Music, Sparkles, Filter, Disc, Radio, Flame, Tv } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { TrackCard } from './TrackCard';
import { TrackRow } from './TrackRow';
import { Track } from '../types';
import { BOLLYWOOD_TOP_HITS, ENGLISH_TOP_HITS, LIVE_RADIO_STATIONS } from '../data/curatedTracks';

interface SearchViewProps {
  onOpenPlaylistModal: (track: Track) => void;
}

const QUICK_TAGS = [
  { label: '🌟 English Top 100', query: 'The Weeknd' },
  { label: '🪕 Bollywood Hits', query: 'Bollywood' },
  { label: '⚡ Alan Walker & EDM', query: 'Alan Walker' },
  { label: '🎸 Imagine Dragons', query: 'Imagine Dragons' },
  { label: '🎹 Ed Sheeran', query: 'Ed Sheeran' },
  { label: '👑 Taylor Swift', query: 'Taylor Swift' },
  { label: '🔥 Punjabi Hits', query: 'Punjabi' },
  { label: '📻 Live HD Radios', query: 'Radio' },
  { label: '☕ Coldplay', query: 'Coldplay' }
];

export const SearchView: React.FC<SearchViewProps> = ({ onOpenPlaylistModal }) => {
  const {
    searchResults,
    searchQuery,
    setSearchQuery,
    performSearch,
    isSearching
  } = useMusicPlayer();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleTagClick = (tagQuery: string) => {
    setSearchQuery(tagQuery);
    performSearch(tagQuery);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Search Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0d0d] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F27D26]/10 text-[#F27D26] flex items-center justify-center border border-[#F27D26]/20">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif italic text-white">
              {searchQuery ? `Results for "${searchQuery}"` : 'Universal Full-Length Music & Radio Search'}
            </h2>
            <p className="text-xs text-white/40">
              Showing {searchResults.length} verified songs • Bollywood, English Top 100 & Global HD Radios
            </p>
          </div>
        </div>

        {/* View mode toggle (Grid vs List) */}
        <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-2 rounded-xl transition ${
              viewMode === 'grid'
                ? 'bg-[#F27D26] text-black font-bold shadow'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-2 rounded-xl transition ${
              viewMode === 'list'
                ? 'bg-[#F27D26] text-black font-bold shadow'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag.label}
            onClick={() => handleTagClick(tag.query)}
            className="px-3.5 py-1.5 rounded-full bg-[#111111] hover:bg-[#191919] border border-white/10 hover:border-[#F27D26]/40 text-xs font-medium text-white/70 hover:text-white whitespace-nowrap transition"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-3 border-[#F27D26]/20 border-t-[#F27D26] rounded-full animate-spin" />
          <p className="text-xs text-white/40 font-mono">Searching catalogs & streaming sources...</p>
        </div>
      )}

      {/* Results Content */}
      {!isSearching && searchResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#0d0d0d] rounded-3xl border border-white/10">
          <Music className="w-12 h-12 text-white/20 mb-3" />
          <h3 className="text-base font-serif italic text-white/80">No matches found</h3>
          <p className="text-xs text-white/40 max-w-sm mt-1">
            Try searching for another artist or hit song (e.g., "Kesariya", "Blinding Lights", "Arijit Singh", "Taylor Swift", "Mirchi")
          </p>
        </div>
      ) : !isSearching && viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {searchResults.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              trackList={searchResults}
              onOpenAddToPlaylist={() => onOpenPlaylistModal(track)}
            />
          ))}
        </div>
      ) : !isSearching && viewMode === 'list' ? (
        <div className="flex flex-col gap-1.5 bg-[#0d0d0d] p-3 rounded-3xl border border-white/10 shadow-xl">
          {searchResults.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              trackList={searchResults}
              onOpenAddToPlaylist={() => onOpenPlaylistModal(track)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

