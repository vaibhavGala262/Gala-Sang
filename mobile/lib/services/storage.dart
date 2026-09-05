import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/playlist.dart';
import '../models/track.dart';

/// Persistence mirroring the web app: favorites, playlists and history are
/// stored as JSON in shared_preferences so they survive restarts.
class Storage {
  static const String favoritesKey = 'free_song_player_favorites_v1';
  static const String playlistsKey = 'gala_playlists_v1';
  static const String historyKey = 'gala_history_v1';

  Future<void> saveFavorites(List<Track> favorites) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = favorites.map((t) => json.encode(t.toMap())).toList();
    await prefs.setStringList(favoritesKey, raw);
  }

  Future<List<Track>> loadFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(favoritesKey) ?? <String>[];
    return raw
        .map((s) => Track.fromMap((json.decode(s) as Map).cast<String, dynamic>()))
        .where((t) => t.audioUrl.isNotEmpty)
        .toList();
  }

  Future<void> savePlaylists(List<Playlist> playlists) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = playlists.map((p) => json.encode(p.toMap())).toList();
    await prefs.setStringList(playlistsKey, raw);
  }

  Future<List<Playlist>> loadPlaylists() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(playlistsKey) ?? <String>[];
    return raw
        .map((s) => Playlist.fromMap((json.decode(s) as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<void> saveHistory(List<Track> history) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = history.map((t) => json.encode(t.toMap())).toList();
    await prefs.setStringList(historyKey, raw);
  }

  Future<List<Track>> loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(historyKey) ?? <String>[];
    return raw
        .map((s) => Track.fromMap((json.decode(s) as Map).cast<String, dynamic>()))
        .where((t) => t.audioUrl.isNotEmpty)
        .toList();
  }
}