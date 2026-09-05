import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app_messenger.dart';
import 'services/audio_service_setup.dart';
import 'services/gala_audio_handler.dart';
import 'state/player_controller.dart';
import 'theme/app_theme.dart';
import 'ui/app_shell.dart';

late final GalaAudioHandler audioHandler;
late final PlayerController playerController;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  audioHandler = await initMediaSession();
  playerController = PlayerController(audioHandler);
  runApp(const GalaSangApp());
}

class GalaSangApp extends StatelessWidget {
  const GalaSangApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<PlayerController>.value(
      value: playerController,
      child: MaterialApp(
        title: 'Gala Sang',
        debugShowCheckedModeBanner: false,
        scaffoldMessengerKey: appMessengerKey,
        theme: AppTheme.dark(),
        home: const AppShell(),
      ),
    );
  }
}