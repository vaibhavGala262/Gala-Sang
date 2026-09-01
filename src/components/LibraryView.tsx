import React, { useState } from 'react';
import { Heart, ListMusic, History, Plus, Play, Trash2, Music, Sparkles } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { CURATED_TRACKS } from '../data/curatedTracks';
import { TrackRow } from './TrackRow';
import { Track } from '../types';

interface LibraryViewProps {
  onOpenCreatePlaylist: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onOpenCreatePlaylist }) => {
  const {
    playlists,
    favoriteTracks,
    recentlyPlayed,
    queue,
    playTrack,
    deletePlaylist,
    removeTrackFromPlaylist
  } = useMusicPlayer();

  const [selectedTab, setSelectedTab] = useState<'playlists' | 'favorites' | 'history'>('playlists');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // Ensure any favorited tracks resolve to full track objects so they persist and render
  const allKnownTracks = [
    ...CURATED_TRACKS,
    ...recentlyPlayed,
    ...queue,
    ...playlists.flatMap(p => p.tracks)
  ];

  const favoriteTracksResolved: Track[] = favoriteTracks
    .map(t => allKnownTracks.find(tk => tk.id === t.id) ?? t)
    // Remove duplicates
    .filter((track, index, self) => index === self.findIndex(t => t.id === track.id));

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedTab('playlists');
              setActivePlaylistId(null);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition ${
              selectedTab === 'playlists' && !activePlaylistId
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            Playlists ({playlists.length})
          </button>
          <button
            onClick={() => {
              setSelectedTab('favorites');
              setActivePlaylistId(null);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition ${
              selectedTab === 'favorites'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 fill-current" />
            Favorites ({favoriteTracks.length})
          </button>
          <button
            onClick={() => {
              setSelectedTab('history');
              setActivePlaylistId(null);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition ${
              selectedTab === 'history'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Recently Played
          </button>
        </div>

        {selectedTab === 'playlists' && !activePlaylistId && (
          <button
            onClick={onOpenCreatePlaylist}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </button>
        )}
      </div>

      {/* Playlist Details View */}
      {activePlaylist ? (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
            <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 shadow-2xl border border-slate-700">
              {activePlaylist.coverImage ? (
                <img src={activePlaylist.coverImage} alt={activePlaylist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <ListMusic className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider">Playlist</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">{activePlaylist.name}</h2>
              <p className="text-xs text-slate-400">{activePlaylist.description || 'Custom User Playlist'}</p>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                {activePlaylist.tracks.length > 0 && (
                  <button
                    onClick={() => playTrack(activePlaylist.tracks[0], activePlaylist.tracks)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/40 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play All
                  </button>
                )}
                <button
                  onClick={() => {
                    deletePlaylist(activePlaylist.id);
                    setActivePlaylistId(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Playlist
                </button>
                <button
                  onClick={() => setActivePlaylistId(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Back to Library
                </button>
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-3xl border border-slate-800">
            {activePlaylist.tracks.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No songs in this playlist yet. Add songs from search or discover!
              </div>
            ) : (
              activePlaylist.tracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  trackList={activePlaylist.tracks}
                  onRemoveFromPlaylist={(id) => removeTrackFromPlaylist(activePlaylist.id, id)}
                />
              ))
            )}
          </div>
        </div>
      ) : selectedTab === 'playlists' ? (
        /* Playlists Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setActivePlaylistId(pl.id)}
              className="flex flex-col p-4 rounded-3xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition group"
            >
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-800 mb-3 shadow-md">
                {pl.coverImage ? (
                  <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ListMusic className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-slate-300">
                  {pl.tracks.length} tracks
                </div>
              </div>

              <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition truncate">
                {pl.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {pl.description || 'Custom playlist'}
              </p>
            </div>
          ))}
        </div>
      ) : selectedTab === 'favorites' ? (
        /* Favorites Tab */
        <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-3xl border border-slate-800">
          {favoriteTracksResolved.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No favorite songs added yet. Heart any song while listening!
            </div>
          ) : (
            favoriteTracksResolved.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                trackList={favoriteTracksResolved}
              />
            ))
          )}
        </div>
      ) : selectedTab === 'history' ? (
        /* History Tab */
        <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-3xl border border-slate-800">
          {recentlyPlayed.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No recently played songs yet.
            </div>
          ) : (
            recentlyPlayed.map((track, idx) => (
              <TrackRow
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                trackList={recentlyPlayed}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
