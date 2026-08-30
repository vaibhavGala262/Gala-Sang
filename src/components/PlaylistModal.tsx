import React, { useState } from 'react';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';
import { Track } from '../types';
import { useMusicPlayer } from '../context/MusicPlayerContext';

interface PlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ track, isOpen, onClose }) => {
  const { playlists, createPlaylist, addTrackToPlaylist } = useMusicPlayer();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName, newPlaylistDesc);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreating(false);
  };

  const handleToggleAdd = (playlistId: string) => {
    if (!track) return;
    addTrackToPlaylist(playlistId, track);
    setAddedPlaylists(prev => [...prev, playlistId]);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div
        id="playlist-modal"
        className="w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-[#E0E0E0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F27D26]/10 text-[#F27D26] flex items-center justify-center border border-[#F27D26]/30">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic text-base text-white">
                {track ? 'Add to Playlist' : 'Your Playlists'}
              </h3>
              {track && (
                <p className="text-xs text-white/40 truncate max-w-[240px]">
                  {track.title} • {track.artist}
                </p>
              )}
            </div>
          </div>
          <button
            id="close-playlist-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Playlists list */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-white/30 text-xs">
              No playlists created yet. Create one below.
            </div>
          ) : (
            playlists.map(pl => {
              const alreadyHas = track ? pl.tracks.some(t => t.id === track.id) : false;
              const isJustAdded = addedPlaylists.includes(pl.id);

              return (
                <div
                  key={pl.id}
                  id={`playlist-item-${pl.id}`}
                  onClick={() => track && handleToggleAdd(pl.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                    alreadyHas || isJustAdded
                      ? 'bg-[#18120c] border-[#F27D26]/40 text-white'
                      : 'bg-[#050505] hover:bg-white/5 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10">
                      {pl.coverImage ? (
                        <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{pl.name}</h4>
                      <p className="text-xs text-white/40 truncate font-mono">{pl.tracks.length} tracks</p>
                    </div>
                  </div>

                  {track && (
                    <button
                      className={`p-2 rounded-full transition ${
                        alreadyHas || isJustAdded
                          ? 'bg-[#F27D26] text-black font-bold'
                          : 'bg-white/5 text-white/40 hover:text-white'
                      }`}
                    >
                      {alreadyHas || isJustAdded ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create Playlist Section */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-3 bg-[#050505] p-4 rounded-2xl border border-white/10">
            <input
              type="text"
              placeholder="Playlist name (e.g. Midnight Vibe)"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F27D26]"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F27D26]"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black text-xs font-bold shadow-md shadow-[#F27D26]/20"
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <button
            id="open-create-playlist-btn"
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 rounded-full border border-dashed border-white/20 hover:border-[#F27D26] text-white/50 hover:text-[#F27D26] flex items-center justify-center gap-2 text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create New Playlist
          </button>
        )}
      </div>
    </div>
  );
};
