import React from 'react';
import { X, Sliders, Sparkles, Volume2, Waves } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { EQUALIZER_PRESETS } from '../data/curatedTracks';
import { EqualizerBands } from '../types';

export const EqualizerModal: React.FC = () => {
  const {
    isEqualizerOpen,
    setIsEqualizerOpen,
    equalizerBands,
    equalizerPreset,
    bassBoost,
    isAutoPan,
    setEqualizerPreset,
    setBandGain,
    setBassBoost,
    toggleAutoPan
  } = useMusicPlayer();

  if (!isEqualizerOpen) return null;

  const bandConfigs: Array<{ key: keyof EqualizerBands; label: string; subLabel: string }> = [
    { key: 'subBass', label: '60 Hz', subLabel: 'Sub-Bass' },
    { key: 'bass', label: '230 Hz', subLabel: 'Bass' },
    { key: 'mids', label: '910 Hz', subLabel: 'Midrange' },
    { key: 'treble', label: '3.6 kHz', subLabel: 'Treble' },
    { key: 'presence', label: '14 kHz', subLabel: 'Presence' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div
        id="equalizer-modal"
        className="w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-[#E0E0E0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F27D26]/10 text-[#F27D26] flex items-center justify-center border border-[#F27D26]/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif italic text-white tracking-tight">Audio Equalizer & FX</h2>
              <p className="text-xs text-white/40">Fine-tune frequencies, bass depth, and spatial acoustics</p>
            </div>
          </div>
          <button
            id="close-equalizer-btn"
            onClick={() => setIsEqualizerOpen(false)}
            aria-label="Close equalizer"
            className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Horizontal Scroll */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-wider text-white/40">
            Sound Presets
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {EQUALIZER_PRESETS.map(preset => (
              <button
                key={preset.name}
                id={`preset-btn-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setEqualizerPreset(preset.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border ${
                  equalizerPreset === preset.name
                    ? 'bg-[#F27D26] border-[#F27D26] text-black font-semibold shadow-md shadow-[#F27D26]/20'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Band Vertical Sliders */}
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between text-[11px] text-white/30 font-mono">
            <span>+12 dB</span>
            <span>0 dB (Flat)</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-5 gap-2 items-center justify-items-center h-48 py-2">
            {bandConfigs.map(({ key, label, subLabel }) => {
              const val = equalizerBands[key];
              return (
                <div key={key} className="flex flex-col items-center justify-between h-full w-full">
                  <span className="text-[11px] font-mono text-[#F27D26] font-semibold">
                    {val > 0 ? `+${val}` : val} dB
                  </span>

                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={val}
                    onChange={(e) => setBandGain(key, parseFloat(e.target.value))}
                    aria-label={`${label} frequency gain`}
                    className="w-32 h-1.5 accent-[#F27D26] bg-white/10 -rotate-90 origin-center cursor-pointer my-12"
                  />

                  <div className="text-center mt-2">
                    <p className="text-xs font-bold text-white/90">{label}</p>
                    <p className="text-[10px] text-white/40">{subLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bass Boost & 3D Spatial Audio Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bass Boost */}
          <div className="bg-[#050505] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#F27D26]" />
                Extra Bass Boost
              </span>
              <span className="text-xs font-mono text-[#F27D26] font-bold">+{bassBoost} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={bassBoost}
              onChange={(e) => setBassBoost(parseInt(e.target.value))}
              aria-label="Extra bass boost level"
              className="w-full h-1.5 bg-white/10 accent-[#F27D26] rounded-lg cursor-pointer mt-1"
            />
          </div>

          {/* Auto-Pan Left ↔ Right */}
          <div className="bg-[#050505] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-[#D4AF37]" />
                Auto-Pan (L ↔ R)
              </span>
              <span className="text-[11px] text-white/40">Gentle left → right stereo sweep</span>
            </div>
            <button
              id="toggle-autopan-btn"
              onClick={toggleAutoPan}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                isAutoPan ? 'bg-[#F27D26]' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isAutoPan ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Done */}
        <div className="flex justify-end">
          <button
            id="done-equalizer-btn"
            onClick={() => setIsEqualizerOpen(false)}
            className="px-6 py-2.5 rounded-full bg-[#F27D26] hover:bg-[#ff8f3d] text-black text-sm font-bold shadow-lg shadow-[#F27D26]/20 transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
