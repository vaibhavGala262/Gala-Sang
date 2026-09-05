import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../data/curated_tracks.dart';
import '../models/track.dart';
import 'des_ecb.dart';

const String _saavnApi = 'https://www.jiosaavn.com/api.php';
const String _desKey = '38346591';

/// DES-ECB decrypt with PKCS7 strip, matching the web app's Node
/// `createDecipheriv('des-ecb', key)` implementation exactly.
String decryptSaavnMediaUrl(String raw) {
  if (raw.isEmpty) return '';
  try {
    final data = base64.decode(raw);
    final out = Des.decrypt(data, Uint8List.fromList(utf8.encode(_desKey)));
    var len = out.length;
    final last = out[len - 1];
    if (last >= 1 && last <= 8 && last <= len) len -= last;
    final url = utf8.decode(out.sublist(0, len), allowMalformed: true);
    if (!url.contains('http')) return '';
    // Prefer full quality 320kbps stream, fallback to 160kbps.
    return url.replaceAll(RegExp(r'_96\.mp4|_160\.mp4'), '_320.mp4');
  } catch (_) {
    return '';
  }
}

String cleanHtmlEntities(String input) {
  if (input.isEmpty) return input;
  return input
      .replaceAll('&#39;', "'")
      .replaceAll('&quot;', '"')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&#x27;', "'")
      .replaceAllMapped(RegExp(r'&#(\d+);'), (m) {
        final code = int.tryParse(m.group(1) ?? '');
        if (code == null || code <= 0) return m.group(0)!;
        return String.fromCharCode(code);
      });
}

Track _fromResult(Map<String, dynamic> item) {
  final language = (item['language'] as String?) ?? '';
  final moreInfo = item['more_info'];
  final collectionLanguage = moreInfo is Map<String, dynamic>
      ? (moreInfo['language'] as String?) ?? ''
      : '';

  String rawMedia = item['encrypted_media_url'] as String? ?? '';
  if (rawMedia.isEmpty) rawMedia = item['encrypted_drm_media_url'] as String? ?? '';
  final audioUrl = decryptSaavnMediaUrl(rawMedia);
  if (audioUrl.isEmpty) {
    return const Track(
      id: '',
      title: '',
      artist: '',
      artwork: '',
      audioUrl: '',
      duration: 0,
      source: 'jiosaavn',
    );
  }

  final img =
      (item['image'] as String?) ?? '';
  final highResArtwork = img.replaceAll('150x150', '500x500');
  final year = int.tryParse((item['year'] as String?) ?? '');
  final duration = int.tryParse((item['duration'] as String?) ?? '') ?? 0;
  final languageLower = language.toLowerCase();
  final langForGenre = languageLower.isEmpty ? collectionLanguage : languageLower;

  return Track(
    id: 'jio-${item['id']}',
    title: cleanHtmlEntities((item['song'] as String?) ?? (item['title'] as String?) ?? 'Unknown Song'),
    artist: cleanHtmlEntities(
        (item['primary_artists'] as String?) ?? (item['singers'] as String?) ?? 'Bollywood Artist'),
    album: cleanHtmlEntities((item['album'] as String?) ?? 'Single'),
    artwork: highResArtwork.isEmpty
        ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
        : highResArtwork,
    audioUrl: audioUrl,
    duration: duration <= 0 ? 240 : duration,
    genre: langForGenre.isEmpty ? 'Bollywood & Desi' : '${langForGenre.toUpperCase()} & Desi',
    releaseYear: year,
    source: 'jiosaavn',
  );
}

/// Search the whole JioSaavn catalog with pagination.
///
/// Mirrors the web app's `searchGlobalSongs`: curated matches are only
/// prepended on page 1; empty queries return the default browse pool; and
/// failures fall back to curated content on page 1 (or [] on later pages).
Future<List<Track>> searchGlobalSongs(String query, {int limit = 40, int page = 1}) async {
  final trimmed = query.trim();
  if (trimmed.isEmpty) return page == 1 ? defaultBrowseTracks : <Track>[];

  final clean = trimmed.toLowerCase();
  final curatedMatches = page == 1
      ? curatedTracks
          .where((t) =>
              t.title.toLowerCase().contains(clean) ||
              t.artist.toLowerCase().contains(clean) ||
              (t.album?.toLowerCase().contains(clean) ?? false) ||
              (t.genre?.toLowerCase().contains(clean) ?? false))
          .toList()
      : <Track>[];

  http.Response response;
  try {
    final q = Uri.encodeQueryComponent(trimmed);
    final url = '$_saavnApi?__call=search.getResults&_format=json&n=$limit&p=$page&q=$q&_marker=0';
    response = await http.get(Uri.parse(url), headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    }).timeout(const Duration(seconds: 20));
    // JioSaavn throttles bursts with 502s - retry once after a short pause.
    if (response.statusCode == 502 || response.statusCode == 429) {
      await Future<void>.delayed(const Duration(milliseconds: 1200));
      response = await http.get(Uri.parse(url), headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
      }).timeout(const Duration(seconds: 20));
    }
  } catch (_) {
    return page == 1 ? (curatedMatches.isNotEmpty ? curatedMatches : bollywoodTopHits) : <Track>[];
  }

  if (response.statusCode != 200) {
    return page == 1 ? (curatedMatches.isNotEmpty ? curatedMatches : bollywoodTopHits) : <Track>[];
  }

  List<dynamic> results = <dynamic>[];
  try {
    final decoded = json.decode(response.body);
    if (decoded is Map<String, dynamic> && decoded['results'] is List) {
      results = decoded['results'] as List<dynamic>;
    }
  } catch (_) {
    return page == 1 ? (curatedMatches.isNotEmpty ? curatedMatches : bollywoodTopHits) : <Track>[];
  }

  final fetched = <Track>[];
  for (final raw in results) {
    if (raw is! Map<String, dynamic>) continue;
    final t = _fromResult(raw);
    if (t.id.isNotEmpty && t.audioUrl.isNotEmpty) fetched.add(t);
  }

  final combined = <Track>[...curatedMatches];
  final seen = <String>{
    for (final t in curatedMatches) '${t.title.toLowerCase()}-${t.artist.toLowerCase()}',
  };
  for (final t in fetched) {
    final key = '${t.title.toLowerCase()}-${t.artist.toLowerCase()}';
    if (seen.add(key)) combined.add(t);
  }
  return combined.isNotEmpty ? combined : (curatedMatches.isNotEmpty ? curatedMatches : <Track>[]);
}