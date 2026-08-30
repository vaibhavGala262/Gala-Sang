import React, { useRef, useState } from 'react';
import { UploadCloud, Music, FolderOpen, Play, CheckCircle2 } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { createTrackFromLocalFile } from '../services/musicApi';
import { TrackRow } from './TrackRow';

export const LocalMusicUploader: React.FC = () => {
  const { localTracks, addLocalTracks } = useMusicPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);

    const validFiles = Array.from(files).filter(f =>
      f.type.startsWith('audio/') ||
      /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      setIsLoading(false);
      return;
    }

    const newTracks = await Promise.all(
      validFiles.map(file => createTrackFromLocalFile(file))
    );

    addLocalTracks(newTracks);
    setIsLoading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? 'border-[#F27D26] bg-[#18120c] scale-[1.01]'
            : 'border-white/10 bg-[#0e0e0e] hover:bg-[#141414] hover:border-white/20'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-16 h-16 rounded-full bg-[#F27D26]/10 text-[#F27D26] flex items-center justify-center border border-[#F27D26]/30 shadow-lg">
          <UploadCloud className="w-8 h-8 animate-bounce [animation-duration:2s]" />
        </div>

        <div className="max-w-md">
          <h3 className="text-lg font-serif italic text-white mb-1">
            {isLoading ? 'Processing Audio Files...' : 'Drop your local audio files here'}
          </h3>
          <p className="text-xs text-white/40">
            Play your own MP3, FLAC, WAV, M4A or OGG tracks right inside your browser for 100% free with equalizer & visualizer support.
          </p>
        </div>

        <button
          type="button"
          className="px-5 py-2.5 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black text-xs font-bold shadow-lg shadow-[#F27D26]/20 transition flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Browse Files from Device
        </button>
      </div>

      {/* Local Files List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif italic text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-[#F27D26]" />
            Uploaded Local Tracks ({localTracks.length})
          </h3>
        </div>

        {localTracks.length === 0 ? (
          <div className="text-center py-12 bg-[#0e0e0e] rounded-2xl border border-white/10 text-white/30 text-xs">
            No local audio files uploaded yet. Drag and drop any songs above to listen freely.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 bg-[#0e0e0e] rounded-2xl p-2 border border-white/10">
            {localTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                trackList={localTracks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
