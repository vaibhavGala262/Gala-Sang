import CryptoJS from 'crypto-js';
import { Track } from '../types';
import { CURATED_TRACKS, BOLLYWOOD_TOP_HITS } from '../data/curatedTracks';

const SAAVN_KEY = CryptoJS.enc.Utf8.parse('38346591');

// Helper to decrypt high-quality AAC stream from JioSaavn
export function decryptSaavnMediaUrl(encryptedUrl: string): string {
  if (!encryptedUrl) return '';
  try {
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl)
    });
    const decrypted = CryptoJS.DES.decrypt(
      cipherParams,
      SAAVN_KEY,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    const rawUrl = decrypted.toString(CryptoJS.enc.Utf8);
    if (!rawUrl) return '';
    // Prefer full quality 320kbps stream, fallback to 160kbps
    return rawUrl.replace(/_96\.mp4|_160\.mp4/, '_320.mp4');
  } catch {
    return '';
  }
}

function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Search database and JioSaavn catalog, resolving all tracks to authentic full-length playback
export async function searchGlobalSongs(query: string, limit = 40): Promise<Track[]> {
  if (!query || query.trim().length === 0) {
    return BOLLYWOOD_TOP_HITS;
  }

  const cleanQuery = query.trim().toLowerCase();

  // 1. Check direct matches from curated Bollywood, Retro, Punjabi and Radio databases
  const curatedMatches = CURATED_TRACKS.filter(
    t => t.title.toLowerCase().includes(cleanQuery) ||
         t.artist.toLowerCase().includes(cleanQuery) ||
         (t.album && t.album.toLowerCase().includes(cleanQuery)) ||
         (t.genre && t.genre.toLowerCase().includes(cleanQuery))
  );

  try {
    const encoded = encodeURIComponent(query.trim());
    // Dev: browsers cannot call JioSaavn directly (no CORS header) so we hit the
    // Vite dev proxy. Prod: the Vercel serverless function (/api/search) proxies it.
    const url = import.meta.env.DEV
      ? `/jiosaavn/api.php?__call=search.getResults&_format=json&n=${limit}&p=1&q=${encoded}&_marker=0`
      : `/api/search?q=${encoded}&n=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      return curatedMatches.length > 0 ? curatedMatches : BOLLYWOOD_TOP_HITS;
    }

    const text = await response.text();
    const data = JSON.parse(text.trim());
    if (!data.results || !Array.isArray(data.results)) {
      return curatedMatches.length > 0 ? curatedMatches : BOLLYWOOD_TOP_HITS;
    }

    const fetchedTracks: Track[] = data.results
      .filter((item: any) => item.song || item.title)
      .map((item: any) => {
        const rawMedia = decryptSaavnMediaUrl(item.encrypted_media_url || item.encrypted_drm_media_url);
        const audioUrl = rawMedia || (item.media_preview_url || '');
        const highResArtwork = (item.image || '').replace('150x150', '500x500') ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

        const releaseYear = item.year ? parseInt(item.year, 10) : undefined;
        const songTitle = cleanHtmlEntities(item.song || item.title || 'Unknown Song');
        const songArtist = cleanHtmlEntities(item.primary_artists || item.singers || item.music || 'Bollywood Artist');
        const songAlbum = cleanHtmlEntities(item.album || 'Single');
        const fullDuration = parseInt(item.duration, 10) || 240;

        return {
          id: `jio-${item.id}`,
          title: songTitle,
          artist: songArtist,
          album: songAlbum,
          artwork: highResArtwork,
          audioUrl: audioUrl,
          duration: fullDuration,
          genre: item.language ? `${item.language.toUpperCase()} & Desi` : 'Bollywood & Desi',
          releaseYear,
          source: 'jiosaavn' as const
        };
      })
      .filter(t => !!t.audioUrl);

    // Merge curated matches first, then resolved search results (deduplicating)
    const combined = [...curatedMatches];
    const seen = new Set(curatedMatches.map(t => `${t.title.toLowerCase()}-${t.artist.toLowerCase()}`));

    for (const track of fetchedTracks) {
      const key = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(track);
      }
    }

    return combined.length > 0 ? combined : (curatedMatches.length > 0 ? curatedMatches : BOLLYWOOD_TOP_HITS);
  } catch (error) {
    console.warn('Live song search fallback to curated tracks:', error);
    return curatedMatches.length > 0 ? curatedMatches : BOLLYWOOD_TOP_HITS;
  }
}

// Convert local file (MP3, WAV, FLAC, M4A) to a playable Track
export async function createTrackFromLocalFile(file: File): Promise<Track> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = objectUrl;

    let cleanTitle = file.name.replace(/\.[^/.]+$/, '');
    let artist = 'Local Audio';
    
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      artist = parts[0].trim();
      cleanTitle = parts.slice(1).join(' - ').trim();
    }

    const defaultArtwork = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80';

    audio.onloadedmetadata = () => {
      resolve({
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        artist: artist,
        album: 'My Local Music',
        artwork: defaultArtwork,
        audioUrl: objectUrl,
        duration: Math.round(audio.duration) || 180,
        genre: 'Local File',
        isLocal: true,
        source: 'local_upload'
      });
    };

    audio.onerror = () => {
      resolve({
        id: `local-${Date.now()}`,
        title: cleanTitle,
        artist: artist,
        album: 'My Local Music',
        artwork: defaultArtwork,
        audioUrl: objectUrl,
        duration: 180,
        genre: 'Local File',
        isLocal: true,
        source: 'local_upload'
      });
    };
  });
}
