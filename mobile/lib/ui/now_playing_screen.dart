import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/player_controller.dart';
import '../theme/app_theme.dart';

class NowPlayingScreen extends StatelessWidget {
  const NowPlayingScreen({super.key});

  void _showAddToPlaylist(BuildContext context, PlayerController player, dynamic track) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceRaised,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Add to playlist',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16)),
            ),
            if (player.playlists.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('No playlists yet — create one first.',
                    style: TextStyle(color: Colors.white54)),
              )
            else
              ...player.playlists.map((pl) => ListTile(
                    leading: const Icon(Icons.queue_music_rounded,
                        color: AppColors.accent),
                    title: Text(pl.name,
                        style: const TextStyle(color: Colors.white)),
                    subtitle: Text('${pl.tracks.length} tracks',
                        style:
                            const TextStyle(color: Colors.white54, fontSize: 12)),
                    onTap: () async {
                      await player.addToPlaylist(pl, track as dynamic);
                      if (ctx.mounted) Navigator.of(ctx).pop();
                    },
                  )),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showSleepTimer(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceRaised,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Sleep Timer',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16)),
            ),
            ListTile(
              leading: const Icon(Icons.timer_off_outlined, color: Colors.white70),
              title: const Text('Off', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.of(ctx).pop(),
            ),
            ...[15, 30, 45, 60]
                .map((m) => ListTile(
                      leading: Icon(Icons.timer_outlined,
                          color: m == 30 ? AppColors.accent : Colors.white70),
                      title: Text('$m minutes',
                          style: const TextStyle(color: Colors.white)),
                      onTap: () => Navigator.of(ctx).pop(),
                    )),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _fmt(int secs) {
    if (secs < 0) secs = 0;
    final m = secs ~/ 60;
    final s = secs % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PlayerController>(
      builder: (context, player, _) {
        final track = player.currentTrack;
        if (track == null) {
          return const Scaffold(
            backgroundColor: AppColors.bg,
            body: Center(
              child: Text('Nothing is playing.',
                  style: TextStyle(color: Colors.white54)),
            ),
          );
        }

        final total = player.duration?.inSeconds ?? track.duration;
        final max = (total > 0 ? total : 0).toDouble();
        final current = player.position.inSeconds.toDouble();
        final isFav = player.isFavorite(track.id);
        final isDownloaded = player.isDownloaded(track);
        final dlProgress = player.downloadProgress[track.id];

        return Scaffold(
          backgroundColor: AppColors.bg,
          body: Stack(
            fit: StackFit.expand,
            children: [
              // Blurred background artwork
              ImageFiltered(
                imageFilter: ui.ImageFilter.blur(sigmaX: 40, sigmaY: 40),
                child: Image.network(
                  track.artwork,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      Container(color: AppColors.bg),
                ),
              ),
              Container(color: Colors.black.withValues(alpha: 0.55)),
              SafeArea(
                child: Column(
                  children: [
                    // Handle + label
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                size: 30),
                            onPressed: () =>
                                Navigator.of(context).maybePop(),
                          ),
                          const Spacer(),
                          const Text('Now Playing',
                              style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1)),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.more_vert_rounded,
                                color: Colors.white70),
                            onPressed: () =>
                                _showSleepTimer(context),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Artwork
                    Expanded(
                      flex: 4,
                      child: Padding(
                        padding:
                            const EdgeInsets.symmetric(horizontal: 24),
                        child: AspectRatio(
                          aspectRatio: 1,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: Image.network(
                              track.artwork,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: AppColors.surface,
                                child: const Icon(
                                    Icons.music_note_rounded,
                                    size: 80,
                                    color: Colors.white24),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Title + artist
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        children: [
                          Text(
                            track.title,
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            track.artist,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                    color: AppColors.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Progress slider
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Slider(
                            value: current.clamp(
                                0.0, max > 0 ? max : 1.0),
                            min: 0,
                            max: max > 0 ? max : 1.0,
                            onChanged: (v) => player.seekTo(
                                Duration(seconds: v.toInt())),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8),
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                Text(_fmt(current.toInt()),
                                    style: const TextStyle(
                                        color: Colors.white54,
                                        fontSize: 12)),
                                Text(_fmt(total),
                                    style: const TextStyle(
                                        color: Colors.white54,
                                        fontSize: 12)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Transport controls
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment:
                            MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton(
                            icon: Icon(Icons.shuffle_rounded,
                                color: player.shuffle
                                    ? AppColors.accent
                                    : Colors.white54),
                            iconSize: 24,
                            onPressed: player.toggleShuffle,
                          ),
                          IconButton(
                            icon:
                                const Icon(Icons.skip_previous_rounded),
                            iconSize: 36,
                            color: AppColors.textPrimary,
                            onPressed: player.previous,
                          ),
                          GestureDetector(
                            onTap: player.togglePlay,
                            child: AnimatedContainer(
                              duration:
                                  const Duration(milliseconds: 200),
                              width: 72,
                              height: 72,
                              decoration: BoxDecoration(
                                color: AppColors.accent,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.accent
                                        .withValues(alpha: 0.35),
                                    blurRadius: 24,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: Icon(
                                player.isPlaying
                                    ? Icons.pause_rounded
                                    : Icons.play_arrow_rounded,
                                color: Colors.black,
                                size: 40,
                              ),
                            ),
                          ),
                          IconButton(
                            icon:
                                const Icon(Icons.skip_next_rounded),
                            iconSize: 36,
                            color: AppColors.textPrimary,
                            onPressed: player.next,
                          ),
                          IconButton(
                            icon: Icon(Icons.repeat_rounded,
                                color: player.repeat != 'off'
                                    ? AppColors.accent
                                    : Colors.white54),
                            iconSize: 24,
                            onPressed: player.toggleRepeat,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Fav + download + playlist+ row
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        mainAxisAlignment:
                            MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton(
                            icon: Icon(
                              isFav
                                  ? Icons.favorite_rounded
                                  : Icons.favorite_border_rounded,
                              color: isFav
                                  ? AppColors.accent
                                  : Colors.white70,
                            ),
                            onPressed: () =>
                                player.toggleFavorite(track),
                          ),
                          IconButton(
                            icon: isDownloaded
                                ? const Icon(
                                    Icons.check_circle_rounded,
                                    color: AppColors.accent)
                                : (dlProgress != null
                                    ? SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          value: dlProgress,
                                          strokeWidth: 2.5,
                                          color: AppColors.accent,
                                          backgroundColor:
                                              Colors.white24,
                                        ),
                                      )
                                    : const Icon(
                                        Icons.download_rounded,
                                        color: Colors.white70)),
                            onPressed: () {
                              if (!isDownloaded &&
                                  dlProgress == null) {
                                player.downloadTrack(track);
                              }
                            },
                          ),
                          IconButton(
                            icon: const Icon(
                                Icons.playlist_add_rounded,
                                color: Colors.white70),
                            onPressed: () =>
                                _showAddToPlaylist(
                                    context, player, track),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}