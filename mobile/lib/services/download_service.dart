import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';

import '../models/track.dart';

class DownloadProgress {
  final String trackId;
  final int received;
  final int total;
  final bool done;
  final bool failed;
  final String? error;
  const DownloadProgress({
    required this.trackId,
    required this.received,
    required this.total,
    required this.done,
    required this.failed,
    this.error,
  });

  double get fraction => total > 0 ? (received / total).clamp(0.0, 1.0) : 0.0;
}

/// Chunked (2 MB Range) downloader that mirrors the web app's downloader.
/// Files land in `<documents>/GalaSang/downloads/` and a small `manifest.json`
/// records the track metadata so downloads are reliably recognised later.
class DownloadService {
  static const int chunkSize = 2 * 1024 * 1024;

  Future<Directory> _downloadsDir() async {
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/GalaSang/downloads');
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  File _manifestFile(Directory dir) => File('${dir.path}/manifest.json');

  String fileNameFor(Track t) {
    final artist = _safe(t.artist);
    final title = _safe(t.title);
    return '$artist - $title.m4a';
  }

  String _safe(String s) =>
      s.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_').trim();

  Future<void> _addManifestEntry(Directory dir, String path, Track t) async {
    final f = _manifestFile(dir);
    final Map<String, dynamic> map = <String, dynamic>{};
    if (await f.exists()) {
      final raw = await f.readAsString();
      if (raw.isNotEmpty) {
        try {
          final decoded = jsonDecode(raw);
          if (decoded is Map<String, dynamic>) map.addAll(decoded);
        } catch (_) {}
      }
    }
    map[path.split(RegExp(r'[\\/]')).last] = <String, dynamic>{
      'id': t.id,
      'title': t.title,
      'artist': t.artist,
      'artwork': t.artwork,
      'duration': t.duration,
    };
    await f.writeAsString(jsonEncode(map));
  }

  /// Downloads [track] to a local file following the web behaviour: single
  /// sequential 2 MB ranges, never concurrent. Writes a manifest entry on
  /// success so [listDownloaded] can resolve the track later.
  Future<File> downloadSong(
    Track track, {
    void Function(DownloadProgress progress)? onProgress,
  }) async {
    final dir = await _downloadsDir();
    final file = File('${dir.path}/${fileNameFor(track)}');

    if (await file.exists()) {
      await _addManifestEntry(dir, file.path, track);
      final len = await file.length();
      onProgress?.call(DownloadProgress(
          trackId: track.id,
          received: len,
          total: len,
          done: true,
          failed: false));
      return file;
    }

    final client = HttpClient();
    client.userAgent = 'GalaSang/1.0 (mobile)';
    var totalBytes = 0;
    var emittedBytes = 0;
    try {
      final uri = Uri.parse(track.audioUrl);

      // Probe with a tiny Range to learn total size.
      final probe = await client.getUrl(uri);
      probe.headers.set(HttpHeaders.rangeHeader, 'bytes=0-0');
      final probeResp = await probe.close();
      if (probeResp.statusCode == 206) {
        totalBytes = _parseTotal(probeResp.headers.value(HttpHeaders.contentRangeHeader));
        await probeResp.drain<void>();
      } else {
        await probeResp.drain<void>();
      }

      final sink = file.openWrite();
      var failed = false;
      var errorMsg = '';

      try {
        if (totalBytes > 0) {
          for (var start = 0; start < totalBytes; start += chunkSize) {
            final end = (start + chunkSize - 1) < totalBytes
                ? start + chunkSize - 1
                : totalBytes - 1;
            final req = await client.getUrl(uri);
            req.headers.set(HttpHeaders.rangeHeader, 'bytes=$start-$end');
            final resp = await req.close();
            if (resp.statusCode != 206 && resp.statusCode != 200) {
              failed = true;
              errorMsg = 'HTTP ${resp.statusCode} at byte $start';
              await resp.drain<void>();
              break;
            }
            await for (final chunk in resp) {
              sink.add(chunk);
              emittedBytes += chunk.length;
              onProgress?.call(DownloadProgress(
                trackId: track.id,
                received: emittedBytes,
                total: totalBytes,
                done: false,
                failed: false,
              ));
            }
          }
        } else {
          // Server ignored Range (200): single full-body stream is fastest.
          final req = await client.getUrl(uri);
          final resp = await req.close();
          if (resp.statusCode != 200 && resp.statusCode != 206) {
            failed = true;
            errorMsg = 'HTTP ${resp.statusCode}';
            await resp.drain<void>();
          } else {
            await for (final chunk in resp) {
              sink.add(chunk);
              emittedBytes += chunk.length;
              onProgress?.call(DownloadProgress(
                trackId: track.id,
                received: emittedBytes,
                total: 0,
                done: false,
                failed: false,
              ));
            }
          }
        }

        if (!failed && totalBytes > 0 && emittedBytes != totalBytes) {
          failed = true;
          errorMsg = 'Incomplete download ($emittedBytes / $totalBytes bytes)';
        }
      } on SocketException catch (e) {
        failed = true;
        errorMsg = e.message;
      } catch (e) {
        failed = true;
        errorMsg = e.toString();
      }

      await sink.flush();
      await sink.close();
      client.close();

      if (failed) {
        await file.delete().catchError((_) => file);
        onProgress?.call(DownloadProgress(
            trackId: track.id,
            received: 0,
            total: totalBytes,
            done: true,
            failed: true,
            error: errorMsg));
        throw HttpException(errorMsg);
      }

      await _addManifestEntry(dir, file.path, track);
      onProgress?.call(DownloadProgress(
          trackId: track.id,
          received: emittedBytes,
          total: emittedBytes,
          done: true,
          failed: false));
      return file;
    } catch (_) {
      client.close();
      rethrow;
    }
  }

  int _parseTotal(String? contentRange) {
    if (contentRange == null) return 0;
    final match = RegExp(r'/\s*(\d+)\s*$').firstMatch(contentRange);
    if (match == null) return 0;
    return int.tryParse(match.group(1) ?? '') ?? 0;
  }

  /// Lists already-downloaded local tracks, keyed by track id.
  Future<Map<String, Track>> listDownloaded() async {
    final dir = await _downloadsDir();
    final out = <String, Track>{};

    // Manifest records exact metadata for reliable matching.
    final manifest = _manifestFile(dir);
    if (await manifest.exists()) {
      try {
        final raw = await manifest.readAsString();
        final decoded = jsonDecode(raw);
        if (decoded is Map<String, dynamic>) {
          for (final MapEntry(:key, :value) in decoded.entries) {
            if (value is! Map<String, dynamic>) continue;
            final path = '${dir.path}/$key';
            if (!await File(path).exists()) continue;
            out[value['id'] as String? ?? path] = Track(
              id: value['id'] as String? ?? 'local-${key.hashCode}',
              title: value['title'] as String? ?? 'Downloaded song',
              artist: value['artist'] as String? ?? 'Unknown',
              artwork: value['artwork'] as String? ?? '',
              audioUrl: path,
              duration: (value['duration'] as num?)?.toInt() ?? 0,
              isLocal: true,
              source: 'local_download',
            );
          }
        }
      } catch (_) {}
    }

    // Fallback: pick up files downloaded before manifest existed.
    await for (final entity in dir.list()) {
      if (entity is! File) continue;
      final name = entity.path.split(RegExp(r'[\\/]')).last;
      if (!name.toLowerCase().endsWith('.m4a')) continue;
      final already = out.values.any((t) => t.audioUrl == entity.path);
      if (already) continue;
      final stripped = name.replaceFirst(RegExp(r'\.m4a$'), '');
      final parts = stripped.split(RegExp(r'\s+-\s+'));
      final artist = parts.length > 1 ? parts[0].trim() : 'Unknown';
      final title = parts.length > 1 ? parts.sublist(1).join(' - ').trim() : stripped;
      out['legacy-${name.hashCode}'] = Track(
        id: 'legacy-${name.hashCode}',
        title: title,
        artist: artist,
        artwork: '',
        audioUrl: entity.path,
        duration: 0,
        isLocal: true,
        source: 'local_download',
      );
    }

    return out;
  }

  Future<String> saveFilename(String name) async {
    final dir = await _downloadsDir();
    final file = File('${dir.path}/${_safe(name)}');
    var counter = 1;
    var target = file;
    while (await target.exists()) {
      target = File('${dir.path}/${_safe(name).replaceAll('.m4a', '')} ($counter).m4a');
      counter++;
    }
    return target.path;
  }

  static String encodeQuery(Map<String, String> params) {
    return params.entries.map((e) =>
        '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}').join('&');
  }

  static String decodeUint8(Uint8List bytes) => utf8.decode(bytes, allowMalformed: true);
}