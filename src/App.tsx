import React, { useState } from 'react';
import { MusicPlayerProvider, useMusicPlayer } from './context/MusicPlayerContext';
import { Navbar } from './components/Navbar';
import { HomeDiscoverView } from './components/HomeDiscoverView';
import { SearchView } from './components/SearchView';
import { RadioStationsView } from './components/RadioStationsView';
import { LibraryView } from './components/LibraryView';
import { LocalMusicUploader } from './components/LocalMusicUploader';
import { PlayerBar } from './components/PlayerBar';
import { NowPlayingModal } from './components/NowPlayingModal';
import { EqualizerModal } from './components/EqualizerModal';
import { PlaylistModal } from './components/PlaylistModal';
import { Track } from './types';

const MainAppContent: React.FC = () => {
  const { activeTab } = useMusicPlayer();
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
      default:
        return <HomeDiscoverView onOpenPlaylistModal={handleOpenPlaylistModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#F27D26] selection:text-black relative">
      {/* Warm Sophisticated Ambient Glow */}
      <div className="fixed inset-0 bg-gradient-to-tr from-[#1a0f08] via-transparent to-transparent opacity-40 pointer-events-none" />

      <div className="flex-1 flex flex-col min-h-screen pb-28 relative z-10">
        <Navbar onOpenPlaylistModal={() => handleOpenPlaylistModal()} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {renderActiveTabContent()}
        </main>
        <PlayerBar />
      </div>

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
