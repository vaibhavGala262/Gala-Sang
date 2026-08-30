import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types';

interface AudioVisualizerProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  className?: string;
  accentColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode = 'bars',
  isPlaying,
  className = 'w-full h-24',
  accentColor = '#F27D26'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    const waveArray = new Uint8Array(bufferLength);

    let phase = 0;

    const render = () => {
      animFrameId.current = requestAnimationFrame(render);
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        audioEngine.getFrequencyData(dataArray);
        audioEngine.getWaveformData(waveArray);
        phase += 0.05;
      } else {
        // Idle gentle wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 4;
        }
      }

      if (mode === 'bars') {
        const barCount = 32;
        const totalGap = (barCount - 1) * 3;
        const barWidth = Math.max(2, (width - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = isPlaying ? dataArray[i] || 0 : Math.sin(phase + i * 0.2) * 4 + 6;
          const percent = val / 255;
          const barHeight = Math.max(4, percent * height * 0.9);
          const x = i * (barWidth + 3);
          const y = height - barHeight;

          // Gradient color from amber to golden bronze
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, '#c25810'); // Deep amber
          grad.addColorStop(0.5, '#F27D26'); // Vibrant amber
          grad.addColorStop(1, '#D4AF37'); // Gold cap

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Top glow cap
          if (isPlaying && percent > 0.3) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, barWidth, 1.5);
          }
        }
      } else if (mode === 'wave') {
        ctx.lineWidth = 2.5;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#F27D26');
        grad.addColorStop(0.5, '#D4AF37');
        grad.addColorStop(1, '#ff9944');

        ctx.strokeStyle = grad;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = isPlaying && waveArray[i] ? waveArray[i] / 128.0 : 1.0 + Math.sin(phase + i * 0.3) * 0.05;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();

        // Glow pass
        ctx.save();
        ctx.shadowColor = '#F27D26';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      } else if (mode === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.6;
        const numPoints = 36;
        const angleStep = (Math.PI * 2) / numPoints;

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < numPoints; i++) {
          const val = isPlaying ? dataArray[i % bufferLength] || 0 : 10;
          const barLen = Math.max(3, (val / 255) * (radius * 0.8));
          const angle = i * angleStep;

          const x1 = Math.cos(angle) * radius;
          const y1 = Math.sin(angle) * radius;
          const x2 = Math.cos(angle) * (radius + barLen);
          const y2 = Math.sin(angle) * (radius + barLen);

          ctx.strokeStyle = i % 2 === 0 ? '#F27D26' : '#D4AF37';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      } else if (mode === 'neon') {
        // Mirrored frequency wave
        const count = 30;
        const step = width / count;
        
        for (let i = 0; i < count; i++) {
          const val = isPlaying ? dataArray[i] || 0 : 5;
          const barH = Math.max(4, (val / 255) * (height / 2));
          const x = i * step + step / 4;
          const midY = height / 2;

          const grad = ctx.createLinearGradient(0, midY - barH, 0, midY + barH);
          grad.addColorStop(0, '#D4AF37');
          grad.addColorStop(0.5, '#F27D26');
          grad.addColorStop(1, '#8b3303');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, midY - barH, step * 0.6, barH * 2, [4, 4, 4, 4]);
          ctx.fill();
        }
      }
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [mode, isPlaying, accentColor]);

  return (
    <canvas
      id="audio-visualizer-canvas"
      ref={canvasRef}
      className={`${className} block rounded-xl`}
    />
  );
};
