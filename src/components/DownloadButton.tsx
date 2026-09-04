import React, { useEffect, useRef, useState } from 'react';
import { Download, Check, Loader2, AlertCircle } from 'lucide-react';
import { Track } from '../types';
import { downloadSong, saveBlobAsFile, trackFileName } from '../services/downloader';

interface DownloadButtonProps {
  track: Track;
  variant?: 'card' | 'row' | 'modal';
}

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';

export const DownloadButton: React.FC<DownloadButtonProps> = ({ track, variant = 'card' }) => {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [percent, setPercent] = useState(0);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  if (track.isLiveRadio) return null;

  const sizeClasses =
    variant === 'modal' ? 'w-5 h-5' : variant === 'row' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  const baseClasses =
    variant === 'card'
      ? 'p-1.5 rounded-full backdrop-blur-md transition bg-black/60 text-white/70 hover:text-white hover:bg-black/90'
      : variant === 'row'
      ? 'p-1.5 rounded-lg transition text-white/40 hover:text-white'
      : 'p-3 rounded-full border transition bg-white/5 border-white/10 text-white/40 hover:text-[#F27D26]';

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (status === 'downloading') return;

    cancelled.current = false;
    setStatus('downloading');
    setPercent(0);

    try {
      const blob = await downloadSong(track.audioUrl, (p) => {
        if (cancelled.current) return;
        setPercent(p.total && p.total > 0 ? Math.min(100, Math.round((p.received / p.total) * 100)) : 0);
      });
      if (cancelled.current) return;
      saveBlobAsFile(blob, trackFileName(track));
      setStatus('done');
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(() => setStatus('idle'), 3500);
    }
  };

  const title =
    status === 'downloading'
      ? percent > 0
        ? `Downloading… ${percent}%`
        : 'Downloading… (buffering)'
      : status === 'done'
      ? 'Saved!'
      : status === 'error'
      ? 'Download failed'
      : 'Download song';

  const icon =
    status === 'downloading' ? (
      <Loader2 className={`${sizeClasses} animate-spin`} />
    ) : status === 'done' ? (
      <Check className={`${sizeClasses} text-emerald-400`} />
    ) : status === 'error' ? (
      <AlertCircle className={`${sizeClasses} text-rose-400`} />
    ) : (
      <Download className={sizeClasses} />
    );

  return (
    <button
      id={`download-btn-${track.id}`}
      onClick={handleClick}
      aria-label="Download song"
      title={title}
      className={`${baseClasses} ${status === 'done' ? 'text-emerald-400' : ''}`}
    >
      {icon}
    </button>
  );
};