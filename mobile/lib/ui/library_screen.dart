import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/playlist.dart';
import '../state/player_controller.dart';
import '../theme/app_theme.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Consumer<PlayerController>(
        builder: (context, player, _) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Text(
                  'Your Library',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              // sub-tabs
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _Pill(
                        label: 'Favorites',
                        active: _tab == 0,
                        onTap: () => setState(() => _tab = 0),
                      ),
                      _Pill(
                        label: 'History',
                        active: _tab == 1,
                        onTap: () => setState(() => _tab = 1),
                      ),
                      _Pill(
                        label: 'Downloads',
                        active: _tab == 2,
                        onTap: () => setState(() => _tab = 2),
                      ),
                      _Pill(
                        label: 'Playlists',
                        active: _tab == 3,
                        onTap: () => setState(() => _tab = 3),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: switch (_tab) {
                  0 => _FavoritesTab(player: player),
                  1 => _HistoryTab(player: player),
                  2 => _DownloadsTab(player: player),
                  _ => _PlaylistsTab(player: player),
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _Pill({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppColors.accent : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.black : Colors.white70,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- tabs

class _FavoritesTab extends StatelessWidget {
  final PlayerController player;
  const _FavoritesTab({required this.player});

  @override
  Widget build(BuildContext context) {
    final favs = player.favorites;
    if (favs.isEmpty) {
      return const _EmptyHint(
          icon: Icons.favorite_border_rounded, message: 'No favorites yet.\nTap the ♥ on any track.');
    }
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 120),
      itemCount: favs.length,
      itemBuilder: (ctx, i) {
        final t = favs[i];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: _Art(t.artwork, 48),
          title: Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          subtitle: Text(t.artist, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white54, fontSize: 12)),
          trailing: IconButton(
            icon: const Icon(Icons.favorite_rounded, color: AppColors.accent, size: 22),
            onPressed: () => player.toggleFavorite(t),
          ),
          onTap: () => player.playTracksFrom(List.of(favs), index: i),
        );
      },
    );
  }
}

class _HistoryTab extends StatelessWidget {
  final PlayerController player;
  const _HistoryTab({required this.player});

  @override
  Widget build(BuildContext context) {
    final hist = player.history;
    if (hist.isEmpty) {
      return const _EmptyHint(
          icon: Icons.history_rounded, message: 'Nothing played yet.\nYour listening history will show here.');
    }
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 120),
      itemCount: hist.length + 1,
      itemBuilder: (ctx, i) {
        if (i == 0) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                const Spacer(),
                TextButton.icon(
                  onPressed: () => player.clearHistory(),
                  icon: const Icon(Icons.cleaning_services_rounded, color: Colors.white38, size: 16),
                  label: const Text('Clear history', style: TextStyle(color: Colors.white38, fontSize: 12)),
                ),
              ],
            ),
          );
        }
        final t = hist[i - 1];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: _Art(t.artwork, 48),
          title: Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          subtitle: Text(t.artist, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white54, fontSize: 12)),
          onTap: () => player.playTrack(t, list: List.of(hist)),
        );
      },
    );
  }
}

class _DownloadsTab extends StatelessWidget {
  final PlayerController player;
  const _DownloadsTab({required this.player});

  static String _fmtSize(int bytes) {
    if (bytes <= 0) return '';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    final list = player.downloadedTracks.values.toList();
    if (list.isEmpty) {
      return const _EmptyHint(
          icon: Icons.download_done_rounded,
          message: 'No downloads yet.\nOpen a song → tap the download icon to save it offline.');
    }
    final totalBytes = player.downloadedSizes.values.fold<int>(0, (a, b) => a + b);
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 120),
      itemCount: list.length + 1,
      itemBuilder: (ctx, i) {
        if (i == 0) {
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Text('${list.length} song${list.length == 1 ? '' : 's'} · ${_fmtSize(totalBytes)} saved on this phone',
                style: const TextStyle(color: Colors.white38, fontSize: 12)),
          );
        }
        final t = list[i - 1];
        final size = player.downloadedSizes[t.id] ?? 0;
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: _Art(t.artwork, 48),
          title: Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${t.artist}  ·  ${_fmtSize(size)}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
              Text(
                t.audioUrl,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white24, fontSize: 10),
              ),
            ],
          ),
          trailing: const Icon(Icons.check_circle_rounded, color: AppColors.accent, size: 20),
          onTap: () => player.playTrack(t, list: List.of(list)),
        );
      },
    );
  }
}

class _PlaylistsTab extends StatelessWidget {
  final PlayerController player;
  const _PlaylistsTab({required this.player});

  @override
  Widget build(BuildContext context) {
    final playlists = player.playlists;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: ElevatedButton.icon(
              onPressed: () => _createPlaylist(context),
              style: ElevatedButton.styleFrom(
                foregroundColor: Colors.black,
                backgroundColor: AppColors.accent,
                elevation: 0,
              ),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('New playlist'),
            ),
          ),
        ),
        Expanded(
          child: playlists.isEmpty
              ? const _EmptyHint(
                  icon: Icons.queue_music_rounded,
                  message: 'No playlists yet.\nCreate one and add your favorites.')
              : ListView.builder(
                  padding: const EdgeInsets.only(bottom: 120),
                  itemCount: playlists.length,
                  itemBuilder: (ctx, i) {
                    final pl = playlists[i];
                    return ListTile(
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: pl.tracks.isNotEmpty
                            ? _Art(pl.tracks.first.artwork, 52)
                            : Container(
                                width: 52,
                                height: 52,
                                color: AppColors.surfaceRaised,
                                child: const Icon(Icons.queue_music_rounded,
                                    color: Colors.white38),
                              ),
                      ),
                      title: Text(pl.name, maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w600)),
                      subtitle: Text('${pl.tracks.length} tracks',
                          style:
                              const TextStyle(color: Colors.white54, fontSize: 12)),
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => PlaylistDetailScreen(playlist: pl))),
                      onLongPress: () => _playlistMenu(context, pl),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Future<void> _createPlaylist(BuildContext context) async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceRaised,
        title: const Text('New playlist',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Playlist name',
            hintStyle: TextStyle(color: Colors.white30),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Create', style: TextStyle(color: AppColors.accent)),
          ),
        ],
      ),
    );
    if (name != null && name.isNotEmpty) {
      player.createPlaylist(name);
    }
  }

  void _playlistMenu(BuildContext context, Playlist pl) {
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
            ListTile(
              leading: const Icon(Icons.edit_rounded, color: Colors.white70),
              title: const Text('Rename', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.of(ctx).pop();
                final controller = TextEditingController(text: pl.name);
                final name = await showDialog<String>(
                  context: context,
                  builder: (dctx) => AlertDialog(
                    backgroundColor: AppColors.surfaceRaised,
                    title: const Text('Rename playlist',
                        style: TextStyle(color: Colors.white)),
                    content: TextField(
                      controller: controller,
                      autofocus: true,
                      style: const TextStyle(color: Colors.white),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(dctx).pop(),
                        child: const Text('Cancel',
                            style: TextStyle(color: Colors.white54)),
                      ),
                      TextButton(
                        onPressed: () =>
                            Navigator.of(dctx).pop(controller.text.trim()),
                        child: const Text('Save',
                            style: TextStyle(color: AppColors.accent)),
                      ),
                    ],
                  ),
                );
                if (name != null && name.isNotEmpty) {
                  player.renamePlaylist(pl, name);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded,
                  color: Color(0xFFE5484D)),
              title: const Text('Delete playlist',
                  style: TextStyle(color: Color(0xFFE5484D))),
              onTap: () {
                player.deletePlaylist(pl.id);
                Navigator.of(ctx).pop();
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- shared

class PlaylistDetailScreen extends StatelessWidget {
  final Playlist playlist;
  const PlaylistDetailScreen({super.key, required this.playlist});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: Text(playlist.name,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: Consumer<PlayerController>(
        builder: (context, player, _) {
          // re-read latest playlist object by id (state may have changed)
          final pl = player.playlists.firstWhere((p) => p.id == playlist.id,
              orElse: () => playlist);

          if (pl.tracks.isEmpty) {
            return const Center(
              child: Text('Playlist is empty.\nAdd songs from the ♥+ menu.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white38)),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.only(bottom: 120),
            itemCount: pl.tracks.length,
            itemBuilder: (ctx, i) {
              final t = pl.tracks[i];
              return ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                leading: _Art(t.artwork, 48),
                title: Text(t.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
                subtitle: Text(t.artist,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style:
                        const TextStyle(color: Colors.white54, fontSize: 12)),
                trailing: IconButton(
                  icon: const Icon(Icons.remove_circle_outline_rounded,
                      color: Colors.white30, size: 20),
                  onPressed: () =>
                      player.removeTrackFromPlaylist(pl, t.id),
                ),
                onTap: () => player.playTracksFrom(List.of(pl.tracks), index: i),
              );
            },
          );
        },
      ),
    );
  }
}

class _Art extends StatelessWidget {
  final String url;
  final double size;
  const _Art(this.url, this.size);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.network(
        url,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          width: size,
          height: size,
          color: AppColors.surfaceRaised,
          child: const Icon(Icons.music_note_rounded,
              color: Colors.white24, size: 22),
        ),
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyHint({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: Colors.white.withValues(alpha: 0.15)),
          const SizedBox(height: 12),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white38, fontSize: 13)),
        ],
      ),
    );
  }
}