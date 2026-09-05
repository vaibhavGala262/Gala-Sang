import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/curated_tracks.dart';
import '../models/track.dart';
import '../state/player_controller.dart';
import '../theme/app_theme.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _listMode = false;
  String _currentQuery = '';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onScroll() {
    final player = context.read<PlayerController>();
    if (_scrollController.position.extentAfter < 300 &&
        !player.isSearchLoadingMore &&
        player.hasMoreSearch &&
        !player.isSearching) {
      player.loadMoreSearch();
    }
  }

  void _submit(String query) {
    if (query.trim().isEmpty) return;
    _currentQuery = query;
    context.read<PlayerController>().performSearch(query);
  }

  void _onTagTap(String query) {
    _controller.text = query;
    setState(() => _currentQuery = query);
    context.read<PlayerController>().performSearch(query);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PlayerController>(
      builder: (context, player, _) {
        final showTags = _currentQuery.isEmpty;
        return SafeArea(
          child: Column(
            children: [
              // Search bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        textInputAction: TextInputAction.search,
                        onSubmitted: _submit,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Search artists, songs, albums...',
                          hintStyle: const TextStyle(color: Colors.white30),
                          prefixIcon: const Icon(Icons.search_rounded,
                              color: Colors.white30),
                          filled: true,
                          fillColor: AppColors.surface,
                          contentPadding: const EdgeInsets.symmetric(vertical: 0),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                          suffixIcon: _controller.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close_rounded,
                                      size: 20, color: Colors.white30),
                                  onPressed: () {
                                    _controller.clear();
                                    setState(() => _currentQuery = '');
                                    context.read<PlayerController>().resetSearch();
                                  },
                                )
                              : null,
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // view toggle
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: IconButton(
                        icon: Icon(
                          _listMode
                              ? Icons.grid_view_rounded
                              : Icons.view_list_rounded,
                          color: Colors.white30,
                          size: 20,
                        ),
                        onPressed: () => setState(() => _listMode = !_listMode),
                      ),
                    ),
                  ],
                ),
              ),

              // Tags or results
              if (showTags) ...[
                Expanded(child: _buildTags(context)),
              ] else ...[
                Expanded(
                  child: _buildResults(context, player),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildTags(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 10),
            child: Text('Browse categories',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.textMuted, letterSpacing: 0.5)),
          ),
          Expanded(
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: quickTags
                  .map((t) => GestureDetector(
                        onTap: () => _onTagTap(t.query),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white10),
                          ),
                          child: Text(
                            t.label,
                            style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w500),
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResults(BuildContext context, PlayerController player) {
    if (player.isSearching) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(strokeWidth: 2.5)),
            SizedBox(height: 12),
            Text('Searching...',
                style: TextStyle(color: Colors.white54, fontSize: 13)),
          ],
        ),
      );
    }
    if (player.searchResults.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.music_off_rounded,
                  size: 48, color: Colors.white.withValues(alpha: 0.15)),
              const SizedBox(height: 12),
              const Text('No matches found',
                  style: TextStyle(color: Colors.white70, fontSize: 16)),
              const SizedBox(height: 6),
              const Text(
                  'Try searching for another artist or song',
                  style: TextStyle(color: Colors.white30, fontSize: 13),
                  textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }

    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          sliver: SliverToBoxAdapter(
            child: Text(
              '${player.searchResults.length} songs',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.45), fontSize: 12),
            ),
          ),
        ),
        _listMode ? _buildList(player) : _buildGrid(player),
        if (player.isSearchLoadingMore)
          const SliverPadding(
            padding: EdgeInsets.symmetric(vertical: 24),
            sliver: SliverToBoxAdapter(
              child: Center(
                child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.accent)),
              ),
            ),
          ),
        if (!player.isSearchLoadingMore && player.hasMoreSearch)
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            sliver: SliverToBoxAdapter(
              child: Center(
                child: OutlinedButton(
                  onPressed: player.loadMoreSearch,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.accent,
                    side: BorderSide(color: AppColors.accent.withValues(alpha: 0.3)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24)),
                  ),
                  child: Text(
                      'Load more (${player.searchResults.length} loaded / 200 max)'),
                ),
              ),
            ),
          ),
        if (!player.hasMoreSearch && player.searchResults.length > 40)
          SliverPadding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            sliver: SliverToBoxAdapter(
              child: Center(
                child: Text(
                  'Reached end (${player.searchResults.length} songs)',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3), fontSize: 11),
                ),
              ),
            ),
          ),
        const SliverToBoxAdapter(child: SizedBox(height: 140)),
      ],
    );
  }

  Widget _buildGrid(PlayerController player) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 0.7,
        ),
        delegate: SliverChildBuilderDelegate(
          (ctx, i) => _CardTrack(
            track: player.searchResults[i],
            list: player.searchResults,
          ),
          childCount: player.searchResults.length,
        ),
      ),
    );
  }

  Widget _buildList(PlayerController player) {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (ctx, i) {
          final track = player.searchResults[i];
          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                track.artwork,
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 48,
                  height: 48,
                  color: AppColors.surface,
                  child: const Icon(Icons.music_note_rounded,
                      color: Colors.white24, size: 22),
                ),
              ),
            ),
            title: Text(track.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w600)),
            subtitle: Text(track.artist,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white54, fontSize: 12)),
            onTap: () => context.read<PlayerController>().playTrack(track,
                list: player.searchResults),
          );
        },
        childCount: player.searchResults.length,
      ),
    );
  }
}

class _CardTrack extends StatelessWidget {
  final Track track;
  final List<Track> list;

  const _CardTrack({required this.track, required this.list});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () =>
          context.read<PlayerController>().playTrack(track, list: list),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                track.artwork,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: AppColors.surfaceRaised,
                  child: const Icon(Icons.music_note_rounded,
                      color: Colors.white24, size: 32),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            track.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
          ),
          Text(
            track.artist,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
        ],
      ),
    );
  }
}