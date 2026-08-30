import React from 'react';
import { Play, Pause, Heart, Plus, Trash2, Radio, Music } from 'lucide-react';
import { Track } from '../types';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from '../utils/formatters';

interface TrackRowProps {
  track: Track;
  index?: number;
  trackList?: Track[];
  showIndex?: boolean;
  showAlbum?: boolean;
  onRemoveFromPlaylist?: (trackId: string) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  trackList,
  showIndex = true,
  showAlbum = true,
  onRemoveFromPlaylist,
  onOpenAddToPlaylist
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleFavorite, isFavorite } = useMusicPlayer();

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const favorited = isFavorite(track.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, trackList);
    }
  };

  return (
    <div
      id={`track-row-${track.id}`}
      onClick={handleRowClick}
      className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
        isCurrent
          ? 'bg-[#18120c] border-[#F27D26]/40 text-white'
          : 'bg-transparent hover:bg-white/5 border-transparent hover:border-white/10 text-white/70 hover:text-white'
      }`}
    >
      {/* Index or Play status */}
      {showIndex && (
        <div className="w-6 flex items-center justify-center text-xs text-white/30 font-mono group-hover:text-white">
          {isThisPlaying ? (
            <div className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 bg-[#F27D26] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-0.5 h-4 bg-[#F27D26] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-0.5 h-2 bg-[#F27D26] rounded-full animate-bounce" />
            </div>
          ) : (
            <span className="group-hover:hidden">{(index !== undefined ? index + 1 : 1)}</span>
          )}
          {!isThisPlaying && (
            <button
              aria-label="Play track"
              className="hidden group-hover:flex items-center justify-center text-[#F27D26] hover:text-[#ff9944]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      )}

      {/* Thumbnail artwork */}
      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1a1a] border border-white/10 shadow-sm">
        <img
          src={track.artwork}
          alt={track.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {track.isLiveRadio && (
          <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-[#F27D26] font-serif italic' : 'text-white'}`}>
          {track.title}
        </h4>
        <p className="text-xs text-white/40 truncate">
          {track.artist}
        </p>
      </div>

      {/* Album (Desktop) */}
      {showAlbum && (
        <div className="hidden md:block w-48 text-xs text-white/40 truncate">
          {track.album || (track.isLiveRadio ? 'Live Broadcast' : 'Single')}
        </div>
      )}

      {/* Genre Badge */}
      {track.genre && (
        <div className="hidden sm:block">
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50 border border-white/10 whitespace-nowrap">
            {track.genre}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          id={`fav-row-btn-${track.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track);
          }}
          aria-label="Favorite song"
          className={`p-1.5 rounded-lg transition ${
            favorited
              ? 'text-rose-500 hover:text-rose-400'
              : 'text-white/40 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {onOpenAddToPlaylist && (
          <button
            id={`add-pl-row-btn-${track.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddToPlaylist(track);
            }}
            aria-label="Add to playlist"
            className="p-1.5 rounded-lg text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {onRemoveFromPlaylist && (
          <button
            id={`remove-pl-row-btn-${track.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromPlaylist(track.id);
            }}
            aria-label="Remove from playlist"
            className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Duration */}
        <span className="w-12 text-right text-xs text-white/30 font-mono">
          {track.isLiveRadio ? 'LIVE' : formatTime(track.duration)}
        </span>
      </div>
    </div>
  );
};
