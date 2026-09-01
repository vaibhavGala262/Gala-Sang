import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, Playlist, RepeatMode, VisualizerMode, EqualizerBands, SleepTimerState, ActiveTab } from '../types';
import { CURATED_TRACKS, EQUALIZER_PRESETS, BOLLYWOOD_TOP_HITS, ENGLISH_TOP_HITS } from '../data/curatedTracks';
import { audioEngine } from '../services/audioEngine';
import { searchGlobalSongs } from '../services/musicApi';

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  playbackRate: number;
  equalizerBands: EqualizerBands;
  equalizerPreset: string;
  bassBoost: number;
  isAutoPan: boolean;
  visualizerMode: VisualizerMode;
  sleepTimer: SleepTimerState;
  playlists: Playlist[];
  favoriteTrackIds: string[];
  recentlyPlayed: Track[];
  localTracks: Track[];
  activeTab: ActiveTab;
  isNowPlayingExpanded: boolean;
  isEqualizerOpen: boolean;
  searchQuery: string;
  searchResults: Track[];
  isSearching: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  cycleRepeatMode: () => void;
  toggleShuffle: () => void;
  setPlaybackRate: (rate: number) => void;
  setEqualizerPreset: (presetName: string) => void;
  setBandGain: (band: keyof EqualizerBands, gain: number) => void;
  setBassBoost: (boost: number) => void;
  toggleAutoPan: () => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setSleepTimerMinutes: (minutes: number) => void;
  cancelSleepTimer: () => void;
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  createPlaylist: (name: string, description?: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addLocalTracks: (tracks: Track[]) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setIsNowPlayingExpanded: (val: boolean) => void;
  setIsEqualizerOpen: (val: boolean) => void;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

const STORAGE_FAVORITES_KEY = 'free_song_player_favorites_v1';
const STORAGE_PLAYLISTS_KEY = 'free_song_player_playlists_v1';
const STORAGE_HISTORY_KEY = 'free_song_player_history_v1';

// High-Availability Backup Streams for 24/7 Live Radio Stations
const RADIO_BACKUP_STREAMS: Record<string, string[]> = {
  'radio-mirchi-hindi': [
    'https://stream.zeno.fm/4m2p4s822p8uv',
    'https://stream.zeno.fm/0r0xa792kwzuv',
    'https://stream.zeno.fm/v22nwt7tnv8uv',
    'https://stream.zeno.fm/f14t9y6bca0uv',
    'https://ice1.somafm.com/groovesalad-128-mp3'
  ],
  'radio-city-hindi': [
    'https://stream.zeno.fm/v22nwt7tnv8uv',
    'https://stream.zeno.fm/h2vqqc9mdg8uv',
    'https://stream.zeno.fm/4m2p4s822p8uv',
    'https://stream.zeno.fm/0r0xa792kwzuv'
  ],
  'radio-bollywood-romantic': [
    'https://stream.zeno.fm/h2vqqc9mdg8uv',
    'https://stream.zeno.fm/4m2p4s822p8uv',
    'https://stream.zeno.fm/0r0xa792kwzuv'
  ],
  'radio-desi-club-party': [
    'https://stream.zeno.fm/0r0xa792kwzuv',
    'https://stream.zeno.fm/f14t9y6bca0uv',
    'https://stream.zeno.fm/a8740u023v8uv'
  ],
  'radio-bolly-top100': [
    'https://stream.zeno.fm/a8740u023v8uv',
    'https://stream.zeno.fm/4m2p4s822p8uv',
    'https://stream.zeno.fm/0r0xa792kwzuv'
  ],
  'radio-bbc-asian': [
    'https://stream.zeno.fm/f14t9y6bca0uv',
    'https://stream.zeno.fm/0r0xa792kwzuv',
    'https://ice1.somafm.com/groovesalad-128-mp3'
  ],
  'radio-hits1-top40': [
    'https://ice1.somafm.com/groovesalad-128-mp3',
    'https://stream.zeno.fm/0r0xa792kwzuv'
  ],
  'radio-capital-fm': [
    'https://stream.zeno.fm/0r0xa792kwzuv',
    'https://ice1.somafm.com/groovesalad-128-mp3'
  ],
  'radio-chillhop': [
    'https://stream.zeno.fm/f3wvbbqmdg8uv',
    'https://ice1.somafm.com/groovesalad-128-mp3'
  ],
  'radio-lofigirl': [
    'https://stream.zeno.fm/0r0xa792kwzuv',
    'https://ice1.somafm.com/groovesalad-128-mp3'
  ],
  'radio-somafm-groovesalad': [
    'https://ice1.somafm.com/groovesalad-128-mp3',
    'https://stream.zeno.fm/0r0xa792kwzuv'
  ],
  'radio-jazzcafe': [
    'https://stream.zeno.fm/h2vqqc9mdg8uv',
    'https://ice1.somafm.com/groovesalad-128-mp3'
  ]
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Audio element reference for all audio and radio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // YouTube IFrame Player reference for visual embeds
  const ytPlayerRef = useRef<any>(null);
  const pendingTrackRef = useRef<Track | null>(null);
  const [isYTReady, setIsYTReady] = useState<boolean>(false);
  const activeEngineRef = useRef<'audio' | 'youtube'>('audio');
  const currentTrackRef = useRef<Track | null>(BOLLYWOOD_TOP_HITS[0]);
  const radioFallbackIndexRef = useRef<number>(0);

  // Core Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(BOLLYWOOD_TOP_HITS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>(CURATED_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(BOLLYWOOD_TOP_HITS[0]?.duration || 268);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);

  // Equalizer & FX
  const [equalizerPreset, setEqualizerPresetState] = useState<string>('Flat (Default)');
  const [equalizerBands, setEqualizerBands] = useState<EqualizerBands>({
    subBass: 0,
    bass: 0,
    mids: 0,
    treble: 0,
    presence: 0
  });
  const [bassBoost, setBassBoostState] = useState<number>(0);
  const [isAutoPan, setIsAutoPan] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  // Sleep Timer
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    active: false,
    remainingSeconds: 0,
    totalSeconds: 0
  });

  // User Library & Lists
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES_KEY);
      return saved ? JSON.parse(saved) : ['bolly-kesariya', 'eng-blinding'];
    } catch {
      return ['bolly-kesariya'];
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAYLISTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'playlist-bollywood-hits',
        name: '🪕 Bollywood Chartbusters',
        description: 'Full-length evergreen & trending Bollywood blockbusters.',
        coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
        tracks: [BOLLYWOOD_TOP_HITS[0], BOLLYWOOD_TOP_HITS[1], BOLLYWOOD_TOP_HITS[2]],
        createdAt: Date.now() - 86400000
      },
      {
        id: 'playlist-billboard-top',
        name: '🌟 Billboard Top 100 Global',
        description: 'Full-length global pop, electronic, and chart-topping hits.',
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        tracks: [ENGLISH_TOP_HITS[0], ENGLISH_TOP_HITS[1], ENGLISH_TOP_HITS[2]],
        createdAt: Date.now() - 172800000
      }
    ];
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [BOLLYWOOD_TOP_HITS[0]];
    } catch {
      return [BOLLYWOOD_TOP_HITS[0]];
    }
  });

  const [localTracks, setLocalTracks] = useState<Track[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isNowPlayingExpanded, setIsNowPlayingExpanded] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Track[]>(CURATED_TRACKS);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Keep currentTrackRef in sync
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Initialize single HTMLAudioElement for all tracks & radio streams
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    // crossOrigin='anonymous' is required for the Web Audio graph to receive
    // real samples from this element (src servers confirm ACAO: *).
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!currentTrackRef.current?.isLiveRadio) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0 && !currentTrackRef.current?.isLiveRadio) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      handleTrackEnd();
    };

    const handleError = (e: Event) => {
      console.warn('Audio stream error notice:', e);
      const cur = currentTrackRef.current;
      if (cur?.isLiveRadio && RADIO_BACKUP_STREAMS[cur.id]) {
        const backups = RADIO_BACKUP_STREAMS[cur.id];
        const nextIdx = radioFallbackIndexRef.current + 1;
        if (nextIdx < backups.length) {
          radioFallbackIndexRef.current = nextIdx;
          console.info(`Switching ${cur.title} to backup stream #${nextIdx + 1}`);
          audio.src = backups[nextIdx];
          audio.play().then(() => {
            setIsPlaying(true);
            audioEngine.resume();
          }).catch(() => {});
          return;
        }
      }
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      audioEngine.resume();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    audioEngine.init(audio);
    audioEngine.connect(audio);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    const initYT = () => {
      if ((window as any).YT && (window as any).YT.Player && !ytPlayerRef.current) {
        try {
          ytPlayerRef.current = new (window as any).YT.Player('global-yt-player', {
            height: '100%',
            width: '100%',
            videoId: BOLLYWOOD_TOP_HITS[0].youtubeVideoId || 'BddP6PYo2gs',
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0
            },
            events: {
              onReady: () => {
                setIsYTReady(true);
                if (pendingTrackRef.current) {
                  const t = pendingTrackRef.current;
                  pendingTrackRef.current = null;
                  const vId = t.youtubeVideoId || 'BddP6PYo2gs';
                  try {
                    ytPlayerRef.current.loadVideoById({ videoId: vId, startSeconds: 0 });
                    ytPlayerRef.current.playVideo();
                    setIsPlaying(true);
                  } catch (err) {
                    console.warn('Pending track play error:', err);
                  }
                }
              },
              onStateChange: (event: any) => {
                if (activeEngineRef.current !== 'youtube') return;
                const state = event.data;
                if (state === 1) { // YT.PlayerState.PLAYING
                  setIsPlaying(true);
                  audioEngine.resume();
                } else if (state === 2) { // YT.PlayerState.PAUSED
                  setIsPlaying(false);
                } else if (state === 0) { // YT.PlayerState.ENDED
                  handleTrackEnd();
                }
              }
            }
          });
        } catch (e) {
          console.warn('Could not initialize YT Player:', e);
        }
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initYT();
    } else {
      (window as any).onYouTubeIframeAPIReady = initYT;
      const poll = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player && !ytPlayerRef.current) {
          initYT();
          clearInterval(poll);
        }
      }, 300);
      return () => clearInterval(poll);
    }
  }, []);

  // Time & Duration Sync Interval for YouTube Engine
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && isPlaying) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const cur = ytPlayerRef.current.getCurrentTime();
            if (typeof cur === 'number' && !isNaN(cur)) {
              setCurrentTime(cur);
            }
          }
          if (typeof ytPlayerRef.current.getDuration === 'function') {
            const dur = ytPlayerRef.current.getDuration();
            if (typeof dur === 'number' && dur > 0 && !isNaN(dur)) {
              setDuration(dur);
            }
          }
        } catch {}
      }
    }, 250);

    return () => clearInterval(syncInterval);
  }, [isPlaying]);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favoriteTrackIds));
    } catch {}
  }, [favoriteTrackIds]);

  // Save playlists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch {}
  }, [playlists]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(recentlyPlayed));
    } catch {}
  }, [recentlyPlayed]);

  // Update EQ bands in AudioEngine whenever they change
  useEffect(() => {
    audioEngine.setBands(equalizerBands, bassBoost);
  }, [equalizerBands, bassBoost]);

  // Toggle the auto left↔right pan effect
  useEffect(() => {
    audioEngine.setAutoPan(isAutoPan);
  }, [isAutoPan]);

  // Sleep Timer countdown ticker
  useEffect(() => {
    if (!sleepTimer.active || sleepTimer.remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setSleepTimer(prev => {
        if (prev.remainingSeconds <= 1) {
          pause();
          return { active: false, remainingSeconds: 0, totalSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimer.active, sleepTimer.remainingSeconds]);

  // Handle Track End
  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      if (activeEngineRef.current === 'youtube' && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(0, true);
          ytPlayerRef.current.playVideo();
        } catch {}
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      nextTrack();
    }
  }, [repeatMode, queue, queueIndex, isShuffled]);

  // Play a specific track (Full length authentic audio engine)
  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    let targetQueue = newQueue || queue;
    if (newQueue) {
      setQueue(newQueue);
    } else if (!queue.some(t => t.id === track.id)) {
      targetQueue = [track, ...queue];
      setQueue(targetQueue);
    }

    const idx = targetQueue.findIndex(t => t.id === track.id);
    setQueueIndex(idx >= 0 ? idx : 0);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setCurrentTime(0);
    setDuration(track.duration || 240);
    radioFallbackIndexRef.current = 0;
    activeEngineRef.current = 'audio';

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = track.audioUrl;
      audio.playbackRate = playbackRate;
      audio.volume = isMuted ? 0 : volume;
      audio.currentTime = 0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            audioEngine.resume();
          })
          .catch(err => {
            console.warn('Initial audio play interrupted, switching to fallback/backup stream:', err);
            if (track.isLiveRadio && RADIO_BACKUP_STREAMS[track.id]) {
              const backups = RADIO_BACKUP_STREAMS[track.id];
              if (backups.length > 1) {
                radioFallbackIndexRef.current = 1;
                audio.src = backups[1];
                audio.play().then(() => {
                  setIsPlaying(true);
                  audioEngine.resume();
                }).catch(() => {});
              }
            }
          });
      }
    }

    // Cue YouTube video for visual tab if available
    if (track.youtubeVideoId && ytPlayerRef.current && typeof ytPlayerRef.current.cueVideoById === 'function') {
      try {
        ytPlayerRef.current.cueVideoById({
          videoId: track.youtubeVideoId,
          startSeconds: 0
        });
      } catch {}
    }

    // Add to history
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 50);
    });
  }, [queue, playbackRate, isMuted, volume]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {}
    }
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (!audio.src && currentTrack) {
        audio.src = currentTrack.audioUrl;
      }
      audio.play().then(() => {
        setIsPlaying(true);
        audioEngine.resume();
      }).catch((err) => {
        console.warn('Resume play notice:', err);
      });
    }
  }, [currentTrack]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    let nextIdx = queueIndex + 1;
    if (isShuffled && queue.length > 1) {
      nextIdx = Math.floor(Math.random() * queue.length);
      if (nextIdx === queueIndex) {
        nextIdx = (queueIndex + 1) % queue.length;
      }
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        pause();
        return;
      }
    }

    const nextSong = queue[nextIdx];
    if (nextSong) {
      setQueueIndex(nextIdx);
      playTrack(nextSong);
    }
  }, [queue, queueIndex, isShuffled, repeatMode, playTrack, pause]);

  const previousTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }

    const prevSong = queue[prevIdx];
    if (prevSong) {
      setQueueIndex(prevIdx);
      playTrack(prevSong);
    }
  }, [queue, queueIndex, currentTime, playTrack]);

  const seek = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    if (activeEngineRef.current === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
      } catch {}
    } else if (audioRef.current && !currentTrackRef.current?.isLiveRadio) {
      try {
        audioRef.current.currentTime = seconds;
      } catch {}
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(isMuted ? 0 : clamped * 100);
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (ytPlayerRef.current) {
        try {
          if (next) ytPlayerRef.current.mute();
          else {
            ytPlayerRef.current.unMute();
            ytPlayerRef.current.setVolume(volume * 100);
          }
        } catch {}
      }
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume;
      }
      return next;
    });
  }, [volume]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => !prev);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const setEqualizerPreset = useCallback((presetName: string) => {
    const preset = EQUALIZER_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setEqualizerPresetState(preset.name);
      setEqualizerBands(preset.bands);
      setBassBoostState(preset.bassBoost || 0);
    }
  }, []);

  const setBandGain = useCallback((band: keyof EqualizerBands, gain: number) => {
    setEqualizerBands(prev => ({
      ...prev,
      [band]: gain
    }));
    setEqualizerPresetState('Custom');
  }, []);

  const setBassBoost = useCallback((boost: number) => {
    setBassBoostState(boost);
  }, []);

  const toggleAutoPan = useCallback(() => {
    setIsAutoPan(prev => !prev);
  }, []);

  const setSleepTimerMinutes = useCallback((minutes: number) => {
    const totalSec = minutes * 60;
    setSleepTimer({
      active: true,
      remainingSeconds: totalSec,
      totalSeconds: totalSec
    });
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setSleepTimer({
      active: false,
      remainingSeconds: 0,
      totalSeconds: 0
    });
  }, []);

  const toggleFavorite = useCallback((track: Track) => {
    setFavoriteTrackIds(prev => {
      if (prev.includes(track.id)) {
        return prev.filter(id => id !== track.id);
      } else {
        return [...prev, track.id];
      }
    });
  }, []);

  const isFavorite = useCallback((trackId: string) => {
    return favoriteTrackIds.includes(trackId);
  }, [favoriteTrackIds]);

  const createPlaylist = useCallback((name: string, description = '') => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: name.trim() || 'My Favorite Mix',
      description: description.trim(),
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      tracks: currentTrack ? [currentTrack] : [],
      createdAt: Date.now()
    };
    setPlaylists(prev => [newPl, ...prev]);
  }, [currentTrack]);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        if (pl.tracks.some(t => t.id === track.id)) return pl;
        return {
          ...pl,
          tracks: [...pl.tracks, track],
          coverImage: pl.tracks.length === 0 ? track.artwork : pl.coverImage
        };
      }
      return pl;
    }));
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          tracks: pl.tracks.filter(t => t.id !== trackId)
        };
      }
      return pl;
    }));
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
  }, []);

  const addLocalTracks = useCallback((tracks: Track[]) => {
    setLocalTracks(prev => [...tracks, ...prev]);
    setQueue(prev => [...tracks, ...prev]);
    if (tracks.length > 0) {
      playTrack(tracks[0]);
    }
  }, [playTrack]);

  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchGlobalSongs(query);
      setSearchResults(results);
    } catch (e) {
      console.warn('Search failed:', e);
      setSearchResults(CURATED_TRACKS);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentTrack]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        queue,
        queueIndex,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffled,
        playbackRate,
        equalizerBands,
        equalizerPreset,
        bassBoost,
        isAutoPan,
        visualizerMode,
        sleepTimer,
        playlists,
        favoriteTrackIds,
        recentlyPlayed,
        localTracks,
        activeTab,
        isNowPlayingExpanded,
        isEqualizerOpen,
        searchQuery,
        searchResults,
        isSearching,

        playTrack,
        togglePlay,
        pause,
        resume,
        nextTrack,
        previousTrack,
        seek,
        setVolume,
        toggleMute,
        cycleRepeatMode,
        toggleShuffle,
        setPlaybackRate,
        setEqualizerPreset,
        setBandGain,
        setBassBoost,
        toggleAutoPan,
        setVisualizerMode,
        setSleepTimerMinutes,
        cancelSleepTimer,
        toggleFavorite,
        isFavorite,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        deletePlaylist,
        addLocalTracks,
        setActiveTab,
        setIsNowPlayingExpanded,
        setIsEqualizerOpen,
        setSearchQuery,
        performSearch,
        addToQueue,
        removeFromQueue,
        clearQueue
      }}
    >
      {children}

      {/* Global YouTube Player Host Container (Kept in DOM for non-stop full audio streaming) */}
      <div
        id="global-yt-player-container"
        className="fixed -bottom-96 -left-96 w-10 h-10 pointer-events-none opacity-0 overflow-hidden"
        aria-hidden="true"
      >
        <div id="global-yt-player" />
      </div>
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
