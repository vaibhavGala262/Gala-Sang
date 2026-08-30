import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, Smartphone, Download, Sparkles, Layers } from 'lucide-react';

export const FlutterCodeViewer: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'main_dart' | 'pubspec' | 'player_service'>('main_dart');

  const copyToClipboard = (text: string, fileKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(fileKey);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const pubspecYaml = `name: free_song_player
description: "A complete free music streaming application in Flutter."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  just_audio: ^0.9.36
  audio_video_progress_bar: ^2.0.1
  http: ^1.2.0
  provider: ^6.1.1
  cached_network_image: ^3.3.1
  google_fonts: ^6.1.0
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`;

  const mainDartCode = `import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FreeSongApp());
}

class FreeSongApp extends StatelessWidget {
  const FreeSongApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Free Song Player',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF090D16),
        primaryColor: const Color(0xFF6366F1),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          ThemeData(brightness: Brightness.dark).textTheme,
        ),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6366F1),
          secondary: Color(0xFFEC4899),
          surface: Color(0xFF131B2E),
        ),
      ),
      home: const MusicHomeScreen(),
    );
  }
}

class Track {
  final String id;
  final String title;
  final String artist;
  final String album;
  final String artwork;
  final String audioUrl;
  final int duration;

  Track({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.artwork,
    required this.audioUrl,
    required this.duration,
  });

  factory Track.fromJson(Map<String, dynamic> json) {
    String art = json['artworkUrl100'] ?? '';
    art = art.replaceAll('100x100bb', '600x600bb');
    return Track(
      id: json['trackId']?.toString() ?? DateTime.now().toString(),
      title: json['trackName'] ?? 'Unknown Song',
      artist: json['artistName'] ?? 'Unknown Artist',
      album: json['collectionName'] ?? 'Single',
      artwork: art.isNotEmpty ? art : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
      audioUrl: json['previewUrl'] ?? '',
      duration: ((json['trackTimeMillis'] ?? 30000) / 1000).round(),
    );
  }
}

class MusicHomeScreen extends StatefulWidget {
  const MusicHomeScreen({super.key});

  @override
  State<MusicHomeScreen> createState() => _MusicHomeScreenState();
}

class _MusicHomeScreenState extends State<MusicHomeScreen> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  final TextEditingController _searchController = TextEditingController();
  List<Track> _tracks = [];
  Track? _currentTrack;
  bool _isLoading = false;
  int _currentNavIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchTrendingTracks('lofi chill hits');
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchTrendingTracks(String query) async {
    setState(() => _isLoading = true);
    try {
      final url = Uri.parse('https://itunes.apple.com/search?term=\${Uri.encodeComponent(query)}&entity=song&limit=25');
      final res = await http.get(url);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final results = (data['results'] as List)
            .where((item) => item['previewUrl'] != null)
            .map((item) => Track.fromJson(item))
            .toList();
        setState(() {
          _tracks = results;
          if (_currentTrack == null && _tracks.isNotEmpty) {
            _currentTrack = _tracks.first;
          }
        });
      }
    } catch (e) {
      debugPrint('Search error: \$e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _playTrack(Track track) async {
    setState(() => _currentTrack = track);
    try {
      await _audioPlayer.setUrl(track.audioUrl);
      _audioPlayer.play();
    } catch (e) {
      debugPrint('Playback error: \$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Free Song Streamer', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.equalizer, color: Color(0xFF6366F1)),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              controller: _searchController,
              onSubmitted: (val) => _fetchTrendingTracks(val),
              decoration: InputDecoration(
                hintText: 'Search millions of free songs...',
                prefixIcon: const Icon(Icons.search, color: Colors.indigoAccent),
                filled: true,
                fillColor: const Color(0xFF131B2E),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          
          // Songs List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Colors.indigoAccent))
                : ListView.builder(
                    itemCount: _tracks.length,
                    itemBuilder: (context, index) {
                      final track = _tracks[index];
                      final isSelected = _currentTrack?.id == track.id;
                      return ListTile(
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(track.artwork, width: 48, height: 48, fit: BoxFit.cover),
                        ),
                        title: Text(track.title, style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isSelected ? const Color(0xFF6366F1) : Colors.white,
                        )),
                        subtitle: Text(track.artist, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        trailing: StreamBuilder<PlayerState>(
                          stream: _audioPlayer.playerStateStream,
                          builder: (context, snapshot) {
                            final isPlaying = snapshot.data?.playing ?? false;
                            if (isSelected && isPlaying) {
                              return const Icon(Icons.graphic_eq, color: Color(0xFF6366F1));
                            }
                            return const Icon(Icons.play_arrow_rounded, color: Colors.grey);
                          },
                        ),
                        onTap: () => _playTrack(track),
                      );
                    },
                  ),
          ),

          // Bottom Mini Player
          if (_currentTrack != null) _buildBottomPlayer(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentNavIndex,
        onDestinationSelected: (idx) => setState(() => _currentNavIndex = idx),
        backgroundColor: const Color(0xFF0B101D),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.music_note), label: 'Discover'),
          NavigationDestination(icon: Icon(Icons.radio), label: 'Radio'),
          NavigationDestination(icon: Icon(Icons.library_music), label: 'Playlists'),
        ],
      ),
    );
  }

  Widget _buildBottomPlayer() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF131B2E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(_currentTrack!.artwork, width: 44, height: 44, fit: BoxFit.cover),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_currentTrack!.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(_currentTrack!.artist, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              StreamBuilder<PlayerState>(
                stream: _audioPlayer.playerStateStream,
                builder: (context, snapshot) {
                  final isPlaying = snapshot.data?.playing ?? false;
                  return IconButton(
                    icon: Icon(isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled),
                    iconSize: 42,
                    color: const Color(0xFF6366F1),
                    onPressed: () {
                      if (isPlaying) {
                        _audioPlayer.pause();
                      } else {
                        _audioPlayer.play();
                      }
                    },
                  );
                },
              ),
            ],
          ),
          StreamBuilder<Duration>(
            stream: _audioPlayer.positionStream,
            builder: (context, snapshot) {
              final position = snapshot.data ?? Duration.zero;
              final duration = _audioPlayer.duration ?? Duration.zero;
              return ProgressBar(
                progress: position,
                total: duration,
                progressBarColor: const Color(0xFF6366F1),
                baseBarColor: Colors.white10,
                thumbColor: const Color(0xFF6366F1),
                barHeight: 3.0,
                thumbRadius: 5.0,
                onSeek: (dur) => _audioPlayer.seek(dur),
              );
            },
          ),
        ],
      ),
    );
  }
}
`;

  const playerServiceCode = `// lib/services/audio_handler.dart
import 'package:just_audio/just_audio.dart';

class MusicAudioService {
  static final MusicAudioService _instance = MusicAudioService._internal();
  factory MusicAudioService() => _instance;
  MusicAudioService._internal();

  final AudioPlayer player = AudioPlayer();

  Future<void> playStream(String url) async {
    try {
      await player.setUrl(url);
      await player.play();
    } catch (e) {
      print('Stream error: \$e');
    }
  }

  void pause() => player.pause();
  void resume() => player.play();
  void seek(Duration pos) => player.seek(pos);
}
`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold w-fit">
              <Smartphone className="w-3.5 h-3.5" />
              Flutter (Dart) Mobile & Desktop Code
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Export to Flutter Mobile App
            </h2>
            <p className="text-sm text-slate-300">
              Here is the complete Flutter (Dart) source code with <code className="text-indigo-300 font-mono">just_audio</code> and iTunes API integration. You can copy this code directly into your Flutter project to compile for iOS, Android, macOS, and Windows!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="copy-flutter-active-btn"
              onClick={() => copyToClipboard(activeTab === 'main_dart' ? mainDartCode : activeTab === 'pubspec' ? pubspecYaml : playerServiceCode, activeTab)}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              {copiedFile === activeTab ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('main_dart')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'main_dart'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          lib/main.dart
        </button>
        <button
          onClick={() => setActiveTab('pubspec')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'pubspec'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          pubspec.yaml
        </button>
        <button
          onClick={() => setActiveTab('player_service')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'player_service'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          lib/services/audio_handler.dart
        </button>
      </div>

      {/* Code Display Container */}
      <div className="relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span>{activeTab === 'main_dart' ? 'lib/main.dart' : activeTab === 'pubspec' ? 'pubspec.yaml' : 'lib/services/audio_handler.dart'}</span>
          <button
            onClick={() => copyToClipboard(activeTab === 'main_dart' ? mainDartCode : activeTab === 'pubspec' ? pubspecYaml : playerServiceCode, activeTab)}
            className="hover:text-white flex items-center gap-1 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedFile === activeTab ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 md:p-6 text-xs md:text-sm font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
          <code>{activeTab === 'main_dart' ? mainDartCode : activeTab === 'pubspec' ? pubspecYaml : playerServiceCode}</code>
        </pre>
      </div>

      {/* Quick Setup Instructions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          How to run this Flutter project:
        </h4>
        <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 leading-relaxed font-sans">
          <li>Create a new Flutter app: <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono">flutter create free_song_player</code></li>
          <li>Paste the <code className="text-indigo-300 font-mono">pubspec.yaml</code> contents and run <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono">flutter pub get</code></li>
          <li>Replace <code className="text-indigo-300 font-mono">lib/main.dart</code> with the Dart code above</li>
          <li>Run on your connected Android or iOS device: <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono">flutter run</code></li>
        </ol>
      </div>
    </div>
  );
};
