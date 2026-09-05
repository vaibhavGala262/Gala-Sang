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
/// Files land in `<documents>/GalaSang/downloads/` and can be re-imported as
/// local tracks.
class DownloadService {
  static const int chunkSize = 2 * 1024 * 1024;

  Future<Directory> _downloadsDir() async {
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/GalaSang/downloads');
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  String fileNameFor(Track t) {
    final artist = _safe(t.artist);
    final title = _safe(t.title);
    return '$artist - $title.m4a';
  }

  String _safe(String s) =>
      s.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_').trim();

  bool isDownloaded(Track t, {required Map<String, String> localPaths}) =>
      localPaths[t.id] != null;

  /// Downloads [track] to a local file following the web behaviour: single
  /// sequential 2 MB ranges, never concurrent.
  Future<File> downloadSong(
    Track track, {
    void Function(DownloadProgress progress)? onProgress,
  }) async {
    final dir = await _downloadsDir();
    final file = File('${dir.path}/${fileNameFor(track)}');
    if (await file.exists()) {
      onProgress?.call(DownloadProgress(
          trackId: track.id,
          received: await file.length(),
          total: await file.length(),
          done: true,
          failed: false));
      return file;
    }

    try {
      final uri = Uri.parse(track.audioUrl);
      final client = HttpClient();
      client.userAgent = 'GalaSang/1.0 (mobile)';

      // Determine total size via the first range request (servers usually reply 206 + Content-Range).
      final firstReq = await client.getUrl(uri);
      firstReq.headers.set(HttpHeaders.rangeHeader, 'bytes=0-${chunkSize - 1}');
      final firstResp = await firstReq.close();
      if (firstResp.statusCode != 206 && firstResp.statusCode != 200) {
        firstResp.drain<void>();
        client.close();
        throw HttpException('Unexpected status ${firstResp.statusCode}');
      }
      final total = _parseTotal(firstResp.headers.value(HttpHeaders.contentRangeHeader));
      firstResp.drain<void>();

      final sink = file.openWrite();
      var received = 0;
      var failed = false;
      var errorMsg = '';

      void emit({bool done = false}) {
        onProgress?.call(DownloadProgress(
          trackId: track.id,
          received: received,
          total: total,
          done: done,
          failed: failed,
          error: errorMsg,
        ));
      }

      try {
        for (var start = 0; start < total || total == 0; start += chunkSize) {
          final end = (total == 0) ? start + chunkSize - 1 : (start + chunkSize - 1).clamp(start, total - 1);
          final req = await client.getUrl(uri);
          req.headers.set(
              HttpHeaders.rangeHeader, total == 0 ? 'bytes=$start-' : 'bytes=$start-$end');
          final resp = await req.close();
          if (resp.statusCode != 206 && resp.statusCode != 200) {
            failed = true;
            errorMsg = 'HTTP ${resp.statusCode}';
            await resp.drain<void>();
            break;
          }
          await for (final chunk in resp) {
            sink.add(chunk);
            received += chunk.length;
            emit();
          }
          if (total == 0 && received > 0 && (received == 0)) break;
          if (total == 0 && received > chunkSize * 2) break;
        }
        if (!failed) {
          emit(done: true);
          // Restore the pad byte if a 200 (no-range) response was returned whole.
        }
      } on SocketException catch (e) {
        failed = true;
        errorMsg = e.message;
      } on HttpException catch (e) {
        failed = true;
        errorMsg = e.message;
      } catch (e) {
        failed = true;
        errorMsg = e.toString();
      }

      await sink.flush();
      await sink.close();
      client.close();
      emit(done: !failed);
      if (failed) throw HttpException(errorMsg);
      return file;
    } catch (_) {
      rethrow;
    }
  }

  int _parseTotal(String? contentRange) {
    if (contentRange == null) return 0;
    final match = RegExp(r'/\s*(\d+)\s*$').firstMatch(contentRange);
    if (match == null) return 0;
    return int.tryParse(match.group(1) ?? '') ?? 0;
  }

  /// Lists already-downloaded local tracks (id -> absolute path).
  Future<Map<String, String>> listDownloaded() async {
    final dir = await _downloadsDir();
    final files = <String, String>{};
    await for (final entity in dir.list()) {
      if (entity is File && (entity.path.toLowerCase().endsWith('.m4a') ||
          entity.path.toLowerCase().endsWith('.mp3') ||
          entity.path.toLowerCase().endsWith('.aac'))) {
        files[entity.path] = entity.path;
      }
    }
    return files;
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