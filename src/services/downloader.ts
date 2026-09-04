import { Track } from '../types';

const CHUNK_SIZE = 2 * 1024 * 1024;

export interface DownloadProgress {
  received: number;
  total: number | null;
}

// Downloads a full-length stream progressively. Prefers sequential Range
// requests (a few MB at a time, exactly like a video player buffering); if the
// CDN blocks Range queries via CORS, falls back to a single streaming request
// that is still consumed (and reported) chunk-by-chunk.
export async function downloadSong(
  audioUrl: string,
  onProgress?: (progress: DownloadProgress) => void,
  signal?: AbortSignal
): Promise<Blob> {
  if (!audioUrl) {
    throw new Error('This track has no downloadable stream.');
  }
  try {
    return await downloadChunked(audioUrl, onProgress, signal);
  } catch {
    return await downloadStreamed(audioUrl, onProgress, signal);
  }
}

async function downloadChunked(
  audioUrl: string,
  onProgress?: (progress: DownloadProgress) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const parts: BlobPart[] = [];
  let received = 0;
  let start = 0;
  let total: number | null = null;

  for (;;) {
    const response = await fetch(audioUrl, {
      signal,
      headers: { Range: `bytes=${start}-${start + CHUNK_SIZE - 1}` }
    });

    if (response.status === 416) {
      break;
    }
    if (!response.ok) {
      throw new Error(`Download failed (HTTP ${response.status}).`);
    }

    const chunk = await response.arrayBuffer();
    if (chunk.byteLength === 0) {
      break;
    }

    if (total === null) {
      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const match = /bytes\s*\d+-\d+\/(\d+)/.exec(contentRange);
        if (match) total = parseInt(match[1], 10);
      } else if (response.status !== 206) {
        total = Number(response.headers.get('Content-Length')) || chunk.byteLength;
      }
    }

    parts.push(chunk);
    received += chunk.byteLength;
    onProgress?.({ received, total });

    if (response.status !== 206) break;
    if (total !== null && received >= total) break;
    if (chunk.byteLength < CHUNK_SIZE) break;
    start += CHUNK_SIZE;
  }

  if (parts.length === 0) {
    throw new Error('Download failed (no data received).');
  }
  return new Blob(parts, { type: 'audio/mp4' });
}

async function downloadStreamed(
  audioUrl: string,
  onProgress?: (progress: DownloadProgress) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const response = await fetch(audioUrl, { signal });
  if (!response.ok) {
    throw new Error(`Download failed (HTTP ${response.status}).`);
  }

  const total = Number(response.headers.get('Content-Length')) || null;
  const reader = response.body?.getReader();
  if (!reader) {
    return response.blob();
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress?.({ received, total });
    }
  }

  if (chunks.length === 0) {
    throw new Error('Download failed (no data received).');
  }
  return new Blob(chunks, { type: 'audio/mp4' });
}

export function trackFileName(track: Track): string {
  const clean = (s: string) => (s || 'Unknown').replace(/[\\/:*?"<>|]/g, '').trim();
  return `${clean(track.artist)} - ${clean(track.title)}.m4a`;
}

export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}