import 'dart:async';
import 'dart:io' as io;
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import '../app_messenger.dart';
import '../data/curated_tracks.dart';
import '../models/playlist.dart';
import '../models/track.dart';
import '../services/download_service.dart';
import '../services/gala_audio_handler.dart';
import '../services/jiosaavn_api.dart';
import '../services/storage.dart';

/// Central app state mirroring the web app's MusicPlayerContext:
/// queue + playback, smart next-track, history-walking previous, shuffle /
/// repeat, favorites, playlists, live radio, downloads and paginated search.
class PlayerController extends ChangeNotifier {
  final GalaAudioHandler handler;
  final DownloadService downloadService = DownloadService();
  final Storage _storage = Storage();
  final math.Random _random = math.Random();

  PlayerController(this.handler) {
    handler.onSkipNext = next;
    handler.onSkipPrevious = previous;
    _attachPlayerStreams();
    _init();
  }

  // ---- Playback state ----
  List<Track> queue = <Track>[];
  int currentIndex = -1;
  bool isPlaying = false;
  bool isBuffering = false;
  Duration position = Duration.zero;
  Duration? buffered;
  Duration? duration;
  bool shuffle = false;
  String repeat = 'off';

  Track? get currentTrack =>
      (currentIndex >= 0 && currentIndex < queue.length) ? queue[currentIndex] : null;

  final Set<String> _playedThisSession = <String>{};

  // ---- Favorites / playlists / history ----
  List<Track> favorites = <Track>[];
  List<Playlist> playlists = <Playlist>[];
  List<Track> history = <Track>[]; // most recent first
  static const int historyLimit = 200;
  bool storageLoaded = false;

  // ---- Downloads ----
  final Map<String, double> downloadProgress = <String, double>{};
  Set<String> downloadedKeys = <String>{};
  final Map<String, String> downloadErrors = <String, String>{};
  Map<String, Track> downloadedTracks = <String, Track>{};
  Map<String, int> downloadedSizes = <String, int>{};

  // ---- Search ----
  String searchQuery = '';
  List<Track> searchResults = List.of(defaultBrowseTracks);
  bool isSearching = false;
  bool isSearchLoadingMore = false;
  bool hasMoreSearch = false;
  int searchPage = 1;
  static const int searchPageSize = 40;
  static const int searchMaxResults = 200;

  int _historyPersistTimer = 0;

  String _keyOf(Track t) => '${t.title.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}';

  // ---------------------------------------------------------------- init

  void _attachPlayerStreams() {
    handler.player.positionStream
        .listen((p) { if (p != position) { position = p; notifyListeners(); } });
    handler.player.durationStream.listen((d) {
      if (d != duration) { duration = d; notifyListeners(); }
    });
    handler.player.playingStream.listen((p) {
      if (p != isPlaying) { isPlaying = p; notifyListeners(); }
    });
    handler.player.bufferedPositionStream.listen((b) {
      buffered = b;
    });
    handler.player.processingStateStream.listen((state) {
      final buffering = state == ProcessingState.loading || state == ProcessingState.buffering;
      if (buffering != isBuffering) { isBuffering = buffering; notifyListeners(); }
      if (state == ProcessingState.completed) _handleTrackCompleted();
    });
  }

  Future<void> _init() async {
    final fav = await _storage.loadFavorites();
    final pl = await _storage.loadPlaylists();
    final hist = await _storage.loadHistory();
    favorites = fav;
    playlists = pl;
    history = hist;
    storageLoaded = true;
    await refreshDownloads();
    notifyListeners();
  }

  // ---------------------------------------------------------------- playback

  Future<void> playTrack(Track track, {List<Track>? list}) async {
    if (track.isRadio) return playRadio(track);
    final src = list ?? queue;
    _playedThisSession.add(track.id);
    queue = List.of(src);
    currentIndex = queue.indexWhere((t) => t.id == track.id);
    if (currentIndex < 0) {
      queue.insert(0, track);
      currentIndex = 0;
    }
    _recordHistory(track);
    await handler.setQueue(queue);
    await handler.loadTrack(track, queue: queue);
    notifyListeners();
  }

  Future<void> playTracksFrom(List<Track> list, {int index = 0}) async {
    if (list.isEmpty) return;
    if (index < 0 || index >= list.length) index = 0;
    await playTrack(list[index], list: list);
  }

  Future<void> playRadio(Track station) async {
    queue = <Track>[station];
    currentIndex = 0;
    _recordHistory(station);
    await handler.setQueue(queue);
    await handler.loadRadio(station);
    notifyListeners();
  }

  Future<void> togglePlay() async {
    if (handler.isLive) return handler.player.playing ? handler.pause() : handler.play();
    if (handler.player.playing) {
      await handler.pause();
    } else if (currentTrack != null) {
      await handler.play();
    }
  }

  Future<void> seekTo(Duration d) async {
    if (currentTrack?.isRadio ?? false) return;
    await handler.seek(d);
  }

  Future<void> seekForward() => handler.seekForward();
  Future<void> seekBackward() => handler.seekBackward();

  void toggleShuffle() {
    shuffle = !shuffle;
    notifyListeners();
  }

  void toggleRepeat() {
    repeat = repeat == 'off' ? 'all' : (repeat == 'all' ? 'one' : 'off');
    notifyListeners();
    final label = switch (repeat) {
      'one' => 'Repeat one · this song loops',
      'all' => 'Repeat all · whole queue loops',
      _ => 'Repeat off',
    };
    appMessengerKey.currentState
      ?..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(label),
        duration: const Duration(milliseconds: 1500),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF2A2A2A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ));
  }

  /// Next track: repeat-one restarts; shuffle picks unplayed songs first;
  /// otherwise moves forward in the queue (wrap on 'all', stops on 'off').
  Future<void> next() async {
    final t = currentTrack;
    if (t == null) return;
    if (t.isRadio) return;

    if (repeat == 'one') {
      await handler.seek(Duration.zero);
      await handler.play();
      return;
    }

    if (shuffle && queue.length > 1) {
      var candidates = queue
          .where((c) => c.id != t.id && !_playedThisSession.contains(c.id))
          .toList();
      if (candidates.isEmpty) {
        _playedThisSession.clear();
        candidates = queue.where((c) => c.id != t.id).toList();
      }
      if (candidates.isNotEmpty) {
        final pick = candidates[_random.nextInt(candidates.length)];
        return playTrack(pick, list: List.of(queue));
      }
    }

    final idx = currentIndex + 1;
    if (idx < queue.length) {
      return playTrack(queue[idx], list: List.of(queue));
    }
    if (repeat == 'all') {
      return queue.isNotEmpty ? playTrack(queue[0], list: List.of(queue)) : null;
    }
    // repeat off: reach the end -> pause at start of last track
    await handler.pause();
    await handler.seek(Duration.zero);
    notifyListeners();
  }

  /// Previous: restart if >3s elapsed (Spotify behaviour), otherwise walk
  /// backwards through the played-history of this session.
  Future<void> previous() async {
    final t = currentTrack;
    if (t == null) return;
    if (position > const Duration(seconds: 3)) {
      await handler.seek(Duration.zero);
      return;
    }
    if (t.isRadio) {
      await handler.seek(Duration.zero);
      return;
    }
    final histIdx = history.indexWhere((h) => h.id == t.id);
    if (histIdx >= 0 && histIdx + 1 < history.length) {
      final older = history[histIdx + 1];
      if (!older.isRadio) {
        await playTrack(older, list: queue.isEmpty ? List.of(queue) : List.of(queue));
        return;
      }
    }
    await handler.seek(Duration.zero);
  }

  void _handleTrackCompleted() {
    if (repeat == 'one') {
      handler.seek(Duration.zero).then((_) => handler.play());
      return;
    }
    if (repeat == 'off') {
      // stay playing the last track from the start after the queue ends
      if (currentIndex >= queue.length - 1) {
        handler.pause().then((_) => handler.seek(Duration.zero));
        return;
      }
    }
    next();
  }

  void _recordHistory(Track track) {
    history.removeWhere((h) => h.id == track.id);
    history.insert(0, track);
    if (history.length > historyLimit) {
      history = history.sublist(0, historyLimit);
    }
    _scheduleHistoryPersist();
    notifyListeners();
  }

  void _scheduleHistoryPersist() {
    _historyPersistTimer++;
    final id = _historyPersistTimer;
    Timer(const Duration(milliseconds: 900), () {
      if (id == _historyPersistTimer) _storage.saveHistory(history);
    });
  }

  Future<void> clearHistory() async {
    history = <Track>[];
    await _storage.saveHistory(history);
    notifyListeners();
  }

  // ---------------------------------------------------------------- favorites

  bool isFavorite(String id) => favorites.any((f) => f.id == id);

  Future<void> toggleFavorite(Track track) async {
    if (isFavorite(track.id)) {
      favorites.removeWhere((f) => f.id == track.id);
    } else {
      favorites.insert(0, track);
    }
    await _storage.saveFavorites(favorites);
    notifyListeners();
  }

  // ---------------------------------------------------------------- playlists

  Future<Playlist> createPlaylist(String name, {String description = ''}) async {
    final pl = Playlist(
      id: 'pl_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      description: description,
      tracks: <Track>[],
      createdAt: DateTime.now().millisecondsSinceEpoch,
    );
    playlists.add(pl);
    await _storage.savePlaylists(playlists);
    notifyListeners();
    return pl;
  }

  Future<void> addToPlaylist(Playlist pl, Track track) async {
    if (pl.tracks.any((t) => t.id == track.id)) return;
    pl.tracks.add(track);
    await _storage.savePlaylists(playlists);
    notifyListeners();
  }

  Future<void> removeTrackFromPlaylist(Playlist pl, String trackId) async {
    pl.tracks.removeWhere((t) => t.id == trackId);
    await _storage.savePlaylists(playlists);
    notifyListeners();
  }

  Future<void> renamePlaylist(Playlist pl, String name) async {
    pl.name = name;
    await _storage.savePlaylists(playlists);
    notifyListeners();
  }

  Future<void> deletePlaylist(String id) async {
    playlists.removeWhere((p) => p.id == id);
    await _storage.savePlaylists(playlists);
    notifyListeners();
  }

  // ---------------------------------------------------------------- downloads

  bool isDownloaded(Track t) => downloadedKeys.contains(_keyOf(t));

  Future<void> refreshDownloads() async {
    final tracks = await downloadService.listDownloaded();
    downloadedTracks = tracks;
    downloadedKeys = tracks.values.map(_keyOf).toSet();
    final sizes = <String, int>{};
    for (final MapEntry(key: id, value: track) in tracks.entries) {
      try {
        sizes[id] = await io.File(track.audioUrl).length();
      } catch (_) {}
    }
    downloadedSizes = sizes;
    notifyListeners();
  }

  Future<void> downloadTrack(Track track) async {
    if (track.isRadio) return;
    if (isDownloaded(track)) return;
    downloadProgress[track.id] = 0.0;
    downloadErrors.remove(track.id);
    notifyListeners();
    try {
      await downloadService.downloadSong(track, onProgress: (p) {
        downloadProgress[track.id] = p.fraction;
        if (p.done) {
          downloadProgress[track.id] = 1.0;
        }
        notifyListeners();
      });
    } catch (e) {
      downloadErrors[track.id] = e.toString();
      downloadProgress.remove(track.id);
    } finally {
      await refreshDownloads();
    }
  }

  // ---------------------------------------------------------------- search

  Future<void> performSearch(String query) async {
    searchQuery = query;
    isSearching = true;
    searchPage = 1;
    hasMoreSearch = false;
    notifyListeners();
    try {
      final results = await searchGlobalSongs(query, limit: searchPageSize, page: 1);
      searchResults = results;
      hasMoreSearch = results.isNotEmpty && (searchPageSize * 2 <= searchMaxResults);
    } catch (_) {
      searchResults = List.of(defaultBrowseTracks);
    } finally {
      isSearching = false;
      notifyListeners();
    }
  }

  Future<void> loadMoreSearch() async {
    final nextPage = searchPage + 1;
    if (nextPage * searchPageSize > searchMaxResults) return;
    if (searchQuery.trim().isEmpty) return;
    isSearchLoadingMore = true;
    notifyListeners();
    try {
      final more =
          await searchGlobalSongs(searchQuery, limit: searchPageSize, page: nextPage);
      final seen = <String>{for (final t in searchResults) t.id};
      final fresh = more.where((t) => seen.add(t.id)).toList();
      searchResults = List.of(searchResults)..addAll(fresh);
      searchPage = nextPage;
      hasMoreSearch = fresh.isNotEmpty &&
          (nextPage + 1) * searchPageSize <= searchMaxResults;
    } catch (_) {
      hasMoreSearch = false;
    } finally {
      isSearchLoadingMore = false;
      notifyListeners();
    }
  }

  void resetSearch() {
    searchQuery = '';
    searchResults = List.of(defaultBrowseTracks);
    searchPage = 1;
    hasMoreSearch = false;
    notifyListeners();
  }
}