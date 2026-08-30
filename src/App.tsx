import React, { useState } from 'react';
import { MusicPlayerProvider, useMusicPlayer } from './context/MusicPlayerContext';
import { Navbar } from './components/Navbar';
import { HomeDiscoverView } from './components/HomeDiscoverView';
import { SearchView } from './components/SearchView';
import { RadioStationsView } from './components/RadioStationsView';
import { LibraryView } from './components/LibraryView';
import { LocalMusicUploader } from './components/LocalMusicUploader';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { PlayerBar } from './components/PlayerBar';
import { NowPlayingModal } from './components/NowPlayingModal';
import { EqualizerModal } from './components/EqualizerModal';
import { PlaylistModal } from './components/PlaylistModal';
import { Track } from './types';
import { Smartphone, Sparkles, Wifi, Battery, Signal } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, isFlutterFrameMode } = useMusicPlayer();
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const handleOpenPlaylistModal = (track?: Track) => {
    setPlaylistModalTrack(track || null);
    setIsPlaylistModalOpen(true);
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDiscoverView onOpenPlaylistModal={handleOpenPlaylistModal} />;
      case 'search':
        return <SearchView onOpenPlaylistModal={handleOpenPlaylistModal} />;
      case 'radio':
        return <RadioStationsView />;
      case 'library':
        return <LibraryView onOpenCreatePlaylist={() => handleOpenPlaylistModal()} />;
      case 'local':
        return <LocalMusicUploader />;
      case 'flutter_code':
        return <FlutterCodeViewer />;
      default:
        return <HomeDiscoverView onOpenPlaylistModal={handleOpenPlaylistModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#F27D26] selection:text-black relative">
      {/* Warm Sophisticated Ambient Glow */}
      <div className="fixed inset-0 bg-gradient-to-tr from-[#1a0f08] via-transparent to-transparent opacity-40 pointer-events-none" />

      {isFlutterFrameMode ? (
        /* Flutter Mobile Device Frame Wrapper */
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 bg-gradient-to-br from-[#050505] via-[#120a05] to-[#050505] min-h-screen relative z-10">
          {/* Frame Top Info */}
          <div className="mb-3 text-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 text-[#F27D26] border border-white/10 text-xs font-semibold tracking-wide shadow-md">
              <Smartphone className="w-3.5 h-3.5 text-[#F27D26]" />
              Flutter Mobile Device Preview (Material 3 UI)
            </span>
          </div>

          {/* Phone Shell */}
          <div className="relative w-full max-w-[420px] h-[860px] bg-[#080808] rounded-[44px] border-[10px] border-[#1a1a1a] shadow-[0_0_60px_rgba(242,125,38,0.15)] flex flex-col overflow-hidden">
            {/* Status Bar */}
            <div className="h-10 bg-[#080808] px-6 flex items-center justify-between text-[11px] text-white/40 font-medium select-none z-30 border-b border-white/5">
              <span className="font-mono">9:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-20 h-4 rounded-full bg-black border border-white/10" />
              <div className="flex items-center gap-1.5 text-white/40">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* App Scrollable Content */}
            <div className="flex-1 flex flex-col overflow-y-auto pb-24 scrollbar-none bg-[#050505]">
              <Navbar onOpenPlaylistModal={() => handleOpenPlaylistModal()} />
              <main className="p-4 flex-1">
                {renderActiveTabContent()}
              </main>
            </div>

            {/* Bottom Sticky Player Bar for Phone */}
            <PlayerBar />

            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50 pointer-events-none" />
          </div>
        </div>
      ) : (
        /* Full Desktop / Responsive Layout */
        <div className="flex-1 flex flex-col min-h-screen pb-28 relative z-10">
          <Navbar onOpenPlaylistModal={() => handleOpenPlaylistModal()} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            {renderActiveTabContent()}
          </main>
          <PlayerBar />
        </div>
      )}

      {/* Fullscreen Modals */}
      <NowPlayingModal />
      <EqualizerModal />
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        track={playlistModalTrack}
        onClose={() => setIsPlaylistModalOpen(false)}
      />

      {/* Persistent Background YouTube Audio/Video Engine */}
      <div
        id="yt-player-container-wrapper"
        className="fixed -bottom-[999px] -left-[999px] w-[200px] h-[200px] pointer-events-none opacity-0 overflow-hidden z-[-10]"
        aria-hidden="true"
      >
        <div id="global-yt-player" />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MusicPlayerProvider>
      <MainAppContent />
    </MusicPlayerProvider>
  );
}
