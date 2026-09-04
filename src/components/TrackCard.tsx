import React, { useState } from 'react';
import { Play, Pause, Heart, Plus, Music2, Radio } from 'lucide-react';
import { Track } from '../types';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatTime } from '../utils/formatters';
import { DownloadButton } from './DownloadButton';

interface TrackCardProps {
  track: Track;
  trackList?: Track[];
  onOpenAddToPlaylist?: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  trackList,
  onOpenAddToPlaylist
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleFavorite, isFavorite } = useMusicPlayer();
  const [imageLoaded, setImageLoaded] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const favorited = isFavorite(track.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, trackList);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track);
  };

  const handleAddPlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenAddToPlaylist) {
      onOpenAddToPlaylist(track);
    }
  };

  return (
    <div
      id={`track-card-${track.id}`}
      onClick={handlePlayClick}
      className={`group relative flex flex-col p-3 rounded-2xl transition-all duration-300 cursor-pointer border ${
        isCurrent
          ? 'bg-[#16100a] border-[#F27D26]/50 shadow-[0_0_25px_rgba(242,125,38,0.12)]'
          : 'bg-[#111111] hover:bg-[#161616] border-white/5 hover:border-white/15'
      }`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#1a1a1a] shadow-md border border-white/5">
        <img
          src={track.artwork}
          alt={track.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] text-white/20 animate-pulse">
            <Music2 className="w-8 h-8" />
          </div>
        )}

        {/* Source or Live badge */}
        {track.isLiveRadio ? (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </div>
        ) : track.genre ? (
          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white/70 text-[10px] font-sans font-medium border border-white/10">
            {track.genre}
          </div>
        ) : null}

        {/* Playing Animated Waveform Badge */}
        {isThisPlaying && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-[#F27D26] text-black text-xs flex items-center gap-1 shadow-md">
            <span className="w-1 h-3 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-4 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-2 bg-black rounded-full animate-bounce" />
          </div>
        )}

        {/* Play / Pause Hover Floating Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
            isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            id={`play-btn-${track.id}`}
            onClick={handlePlayClick}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            className="w-12 h-12 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black flex items-center justify-center shadow-xl shadow-[#F27D26]/40 transform transition duration-200 hover:scale-110 active:scale-95 font-bold"
          >
            {isThisPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Quick Action Corner Buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div className="transition-opacity">
            <DownloadButton variant="card" track={track} />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            id={`fav-btn-${track.id}`}
            onClick={handleFavoriteClick}
            aria-label="Favorite song"
            className={`p-1.5 rounded-full backdrop-blur-md transition ${
              favorited
                ? 'bg-rose-500 text-white'
                : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/90'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
          </button>
          {onOpenAddToPlaylist && (
            <button
              id={`add-pl-btn-${track.id}`}
              onClick={handleAddPlaylistClick}
              aria-label="Add to playlist"
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white backdrop-blur-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-3 flex flex-col gap-0.5">
        <h3
          title={track.title}
          className={`font-semibold text-sm truncate transition ${
            isCurrent ? 'text-[#F27D26] font-serif italic text-base' : 'text-white/90 group-hover:text-white'
          }`}
        >
          {track.title}
        </h3>
        <p title={track.artist} className="text-xs text-white/45 truncate">
          {track.artist}
        </p>

        <div className="mt-1 flex items-center justify-between text-[11px] text-white/30">
          <span className="truncate max-w-[120px]">{track.album || (track.isLiveRadio ? 'Live Stream' : 'Free Stream')}</span>
          {!track.isLiveRadio && (
            <span className="font-mono">{formatTime(track.duration)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
