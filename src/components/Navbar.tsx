import React, { useState, useEffect } from 'react';
import {
  Search,
  Radio,
  ListMusic,
  FolderOpen,
  Sliders,
  Moon,
  Heart,
  Sparkles
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { POPULAR_GENRES } from '../data/curatedTracks';
import { ActiveTab } from '../types';
import { formatTime } from '../utils/formatters';

interface NavbarProps {
  onOpenPlaylistModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPlaylistModal }) => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    performSearch,
    isSearching,
    setIsEqualizerOpen,
    sleepTimer
  } = useMusicPlayer();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.trim().length > 0) {
        performSearch(localQuery);
        if (activeTab !== 'search') {
          setActiveTab('search');
        }
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [localQuery, performSearch]);

  const handleGenreClick = (genre: typeof POPULAR_GENRES[0]) => {
    setSelectedGenre(genre.id);
    setLocalQuery(genre.query);
    setSearchQuery(genre.query);
    performSearch(genre.query);
    setActiveTab('search');
  };

  const navTabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Explore', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'radio', label: 'Live Radio', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'library', label: 'Collection', icon: <ListMusic className="w-3.5 h-3.5" /> },
    { id: 'local', label: 'Local Audio', icon: <FolderOpen className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
        {/* Top Row: Brand, Search Bar, Mode Switchers */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-[#F27D26]/20 group-hover:scale-105 transition duration-300 ring-1 ring-white/10">
              <img
                src="/logo.png"
                alt="Gala Sang"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-serif italic text-lg tracking-tight text-white flex items-center gap-2">
                Gala Sang
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F27D26]/20 text-[#F27D26] font-sans font-bold border border-[#F27D26]/30 uppercase tracking-wider not-italic">
                  Free
                </span>
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-sans">Universal Stream & Player</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-xl relative">
            <div className="relative flex items-center bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-white/20 focus-within:border-[#F27D26]/60 transition">
              <Search className={`w-4 h-4 flex-shrink-0 ${isSearching ? 'text-[#F27D26] animate-spin' : 'text-white/40'}`} />
              <input
                id="search-songs-input"
                type="text"
                value={localQuery}
                onChange={(e) => {
                  setLocalQuery(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search artists, songs, or albums..."
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs md:text-sm w-full ml-2 text-white/90 placeholder-white/30"
              />
              {localQuery ? (
                <button
                  onClick={() => {
                    setLocalQuery('');
                    setSearchQuery('');
                  }}
                  className="text-xs text-white/40 hover:text-white ml-1"
                >
                  ✕
                </button>
              ) : (
                <span className="hidden md:inline-block text-[10px] text-white/30 border border-white/15 px-1.5 py-0.5 rounded font-mono">
                  SEARCH
                </span>
              )}
            </div>
          </div>

          {/* Right Action Switchers */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Equalizer Quick Button */}
            <button
              id="navbar-eq-btn"
              onClick={() => setIsEqualizerOpen(true)}
              title="Audio Equalizer & Spatial FX"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-[#F27D26] transition"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5 border-t border-white/5 pt-2">
          <div className="flex items-center gap-1">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#F27D26] text-black font-semibold shadow-md shadow-[#F27D26]/25'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {sleepTimer.active && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F27D26]/15 border border-[#F27D26]/30 text-[11px] text-[#F27D26] whitespace-nowrap font-mono">
              <Moon className="w-3 h-3 text-[#F27D26]" />
              <span>Sleep: {formatTime(sleepTimer.remainingSeconds)}</span>
            </div>
          )}
        </div>

        {/* Popular Genres & Mood Tags Scroll */}
        {(activeTab === 'home' || activeTab === 'search') && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 mr-1 flex-shrink-0 font-bold">
              Genres:
            </span>
            {POPULAR_GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGenreClick(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition ${
                  selectedGenre === g.id && activeTab === 'search'
                    ? 'bg-gradient-to-r from-[#F27D26] to-[#D4AF37] text-black font-semibold border-transparent shadow'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
