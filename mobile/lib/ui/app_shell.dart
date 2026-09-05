import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/player_controller.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'search_screen.dart';
import 'library_screen.dart';
import 'radio_screen.dart';
import 'mini_player.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _tab = 0;

  final _pages = <Widget>[
    const HomeScreen(),
    const SearchScreen(),
    const LibraryScreen(),
    const RadioScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<PlayerController>(
      builder: (context, player, _) {
        return Scaffold(
          body: Column(
            children: [
              Expanded(child: _pages[_tab]),
              if (player.currentTrack != null) const MiniPlayer(),
            ],
          ),
          bottomNavigationBar: BottomNavigationBar(
            type: BottomNavigationBarType.fixed,
            backgroundColor: AppColors.surface,
            selectedItemColor: AppColors.accent,
            unselectedItemColor: AppColors.textMuted,
            currentIndex: _tab,
            onTap: (i) {
              if (i == _tab) return;
              setState(() => _tab = i);
            },
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home_rounded),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.search_rounded),
                label: 'Search',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.library_music_outlined),
                activeIcon: Icon(Icons.library_music_rounded),
                label: 'Library',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.radio_outlined),
                activeIcon: Icon(Icons.radio_rounded),
                label: 'Radio',
              ),
            ],
          ),
        );
      },
    );
  }
}