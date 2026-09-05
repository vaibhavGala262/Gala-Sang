import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/curated_tracks.dart';
import '../state/player_controller.dart';
import '../theme/app_theme.dart';

class RadioScreen extends StatelessWidget {
  const RadioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Consumer<PlayerController>(
        builder: (context, player, _) {
          final stations = liveRadioStations;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  children: [
                    const Icon(Icons.radio_rounded, color: AppColors.accent, size: 26),
                    const SizedBox(width: 10),
                    Text('Live HD Radios',
                        style: Theme.of(context).textTheme.headlineSmall),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Always-on crystal-clear stations, streamed straight to your ears',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppColors.textMuted),
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.only(bottom: 120),
                  itemCount: stations.length,
                  itemBuilder: (ctx, i) {
                    final s = stations[i];
                    final isCurrent = player.currentTrack?.id == s.id;
                    final isPlaying = isCurrent && player.isPlaying;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: GestureDetector(
                        onTap: () => player.playRadio(s),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isCurrent
                                  ? const [Color(0xFF3B1D0C), Color(0xFF1B0F06)]
                                  : const [AppColors.surface, AppColors.surface],
                            ),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: isCurrent
                                  ? AppColors.accent.withValues(alpha: 0.6)
                                  : Colors.white10,
                            ),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  s.artwork,
                                  width: 56,
                                  height: 56,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 56,
                                    height: 56,
                                    color: AppColors.surfaceRaised,
                                    child: const Icon(Icons.radio_rounded,
                                        color: Colors.white30),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(s.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text(
                                      isCurrent
                                          ? (isPlaying
                                              ? 'LIVE · Playing now'
                                              : 'LIVE · Paused')
                                          : (s.radioLocation?.isNotEmpty ?? false
                                              ? s.radioLocation!
                                              : 'Radio station'),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color: isCurrent
                                            ? AppColors.accent
                                            : Colors.white38,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                isPlaying
                                    ? Icons.equalizer_rounded
                                    : Icons.play_circle_fill_rounded,
                                color: isCurrent ? AppColors.accent : Colors.white38,
                                size: 28,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}