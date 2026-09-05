import 'package:flutter/material.dart';
import 'package:audio_service/audio_service.dart';
import 'package:provider/provider.dart';

import 'app_messenger.dart';
import 'services/gala_audio_handler.dart';
import 'state/player_controller.dart';
import 'theme/app_theme.dart';
import 'ui/app_shell.dart';

late final GalaAudioHandler audioHandler;
late final PlayerController playerController;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    audioHandler = await AudioService.init<GalaAudioHandler>(
      builder: () => GalaAudioHandler(),
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'com.galasang.gala_sang.channel.audio',
        androidNotificationChannelName: 'Gala Sang',
        androidNotificationIcon: 'mipmap/ic_launcher',
        androidStopForegroundOnPause: true,
        androidNotificationOngoing: true,
        fastForwardInterval: Duration(seconds: 10),
        rewindInterval: Duration(seconds: 10),
      ),
    );
  } catch (e) {
    // Never let audio-service setup block or kill the app: fall back to a
    // bare handler so playback still works (just without lock-screen media).
    debugPrint('AudioService.init failed, continuing without media session: $e');
    audioHandler = GalaAudioHandler();
  }
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