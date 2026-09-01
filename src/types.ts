export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  audioUrl: string;
  duration: number; // in seconds
  genre?: string;
  releaseYear?: number | string;
  isLiveRadio?: boolean;
  isLocal?: boolean;
  lyrics?: string;
  syncedLyrics?: Array<{ time: number; text: string }>;
  youtubeVideoId?: string;
  radioFrequency?: string;
  radioLocation?: string;
  radioCategory?: 'bollywood' | 'english_top40' | 'chill_lofi' | 'jazz_classical';
  source: 'jiosaavn' | 'free_archive' | 'itunes_preview' | 'radio' | 'local_upload' | 'youtube' | 'featured';
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  tracks: Track[];
  createdAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'circle' | 'neon';

export interface EqualizerBands {
  subBass: number; // 60Hz (-12 to +12 dB)
  bass: number;    // 230Hz
  mids: number;    // 910Hz
  treble: number;  // 3600Hz
  presence: number;// 14000Hz
}

export interface EqualizerPreset {
  name: string;
  bands: EqualizerBands;
  spatial3D?: boolean;
  bassBoost?: number;
}

export type ActiveTab = 'home' | 'search' | 'library' | 'radio' | 'local';

export interface SleepTimerState {
  active: boolean;
  remainingSeconds: number;
  totalSeconds: number;
}
