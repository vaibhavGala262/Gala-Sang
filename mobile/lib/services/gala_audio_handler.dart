import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';

import '../models/track.dart';

/// AudioService handler hosting a just_audio player. Provides lock-screen /
/// notification transport controls and correctly reports playback position,
/// duration and queue to the OS. All app-level state lives in
/// [PlayerController]; this class only owns the audio engine + media session.
class GalaAudioHandler extends BaseAudioHandler with SeekHandler {
  final AudioPlayer player = AudioPlayer();

  Track? current;
  List<Track> _queue = <Track>[];
  bool _isLive = false;

  Future<void> Function()? onSkipNext;
  Future<void> Function()? onSkipPrevious;

  GalaAudioHandler() {
    player.playbackEventStream.listen(_broadcastState);
    player.currentIndexStream.listen((_) => _notifyQueueChange());
    player.playerStateStream.listen((state) {
      final playing = state.playing;
      if (_playing != playing) {
        _playing = playing;
        _broadcastState(player.playbackEvent);
      }
    });
  }

  bool _playing = false;
  bool get isLive => _isLive;

  List<Track> get trackQueue => List.unmodifiable(_queue);

  Future<void> loadTrack(Track track, {List<Track>? queue}) async {
    _queue = queue ?? <Track>[track];
    current = track;
    _isLive = track.isRadio;
    _notifyQueueChange();
    await player.stop();
    if (track.isRadio) {
      await player.setUrl(track.audioUrl, preload: true);
      await player.play();
    } else {
      AudioSource source;
      try {
        source = ProgressiveAudioSource(Uri.parse(track.audioUrl));
      } catch (_) {
        source = ProgressiveAudioSource(Uri.parse(track.audioUrl));
      }
      await player.setAudioSource(source);
      await player.play();
    }
  }

  Future<void> loadRadio(Track station) async {
    _queue = <Track>[station];
    current = station;
    _isLive = true;
    _notifyQueueChange();
    await player.stop();
    await player.setUrl(station.audioUrl, preload: true);
    await player.play();
  }

  Future<void> setQueue(List<Track> trackQueue) async {
    _queue = trackQueue;
    _notifyQueueChange();
  }

  void _notifyQueueChange() {
    final mediaQueue = <MediaItem>[
      for (final t in _queue)
        MediaItem(
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.isRadio ? null : Duration(seconds: t.duration),
          artUri: Uri.tryParse(t.artwork),
        ),
    ];
    queue.add(mediaQueue);
    playbackState.add(_playbackStateFor(player.playbackEvent, playing: _playerPlaying));
  }

  bool get _playerPlaying => player.playing;

  @override
  Future<void> play() => player.play();

  @override
  Future<void> pause() => player.pause();

  @override
  Future<void> stop() async {
    await player.stop();
    await super.stop();
  }

  @override
  Future<void> seek(Duration position) async {
    if (_isLive) return;
    await player.seek(position);
  }

  @override
  Future<void> skipToNext() async {
    if (onSkipNext != null) {
      return onSkipNext!();
    }
    await player.seek(player.position + const Duration(seconds: 10));
  }

  @override
  Future<void> skipToPrevious() async {
    if (onSkipPrevious != null) {
      return onSkipPrevious!();
    }
    await player.seek(player.position > const Duration(seconds: 10)
        ? player.position - const Duration(seconds: 10)
        : Duration.zero);
  }

  @override
  Future<void> seekForward([bool skipInterruptions = true]) async {
    if (_isLive) return;
    await player.seek(player.position + const Duration(seconds: 10));
  }

  @override
  Future<void> seekBackward([bool skipInterruptions = true]) async {
    if (_isLive) return;
    await player.seek(player.position - const Duration(seconds: 10));
  }

  void _broadcastState(PlaybackEvent event) {
    playbackState.add(_playbackStateFor(event, playing: _playerPlaying));
  }

  PlaybackState _playbackStateFor(PlaybackEvent event, {required bool playing}) {
    return PlaybackState(
      controls: [
        MediaControl.skipToPrevious,
        if (playing) MediaControl.pause else MediaControl.play,
        MediaControl.skipToNext,
      ],
      systemActions: const {
        MediaAction.seek,
        MediaAction.seekForward,
        MediaAction.seekBackward,
      },
      androidCompactActionIndices: const [0, 1, 2],
      processingState: const {
        ProcessingState.idle: AudioProcessingState.idle,
        ProcessingState.loading: AudioProcessingState.loading,
        ProcessingState.buffering: AudioProcessingState.buffering,
        ProcessingState.ready: AudioProcessingState.buffering,
        ProcessingState.completed: AudioProcessingState.completed,
      }[player.processingState]!,
      playing: playing,
      updatePosition: player.position,
      bufferedPosition: player.bufferedPosition,
      speed: 1.0,
      queueIndex: current == null ? -1 : _queue.indexWhere((t) => t.id == current!.id),
    );
  }
}