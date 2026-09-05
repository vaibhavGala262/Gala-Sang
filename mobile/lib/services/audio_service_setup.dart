import 'package:audio_service/audio_service.dart';

import 'gala_audio_handler.dart';

/// Global media-session status so the UI can explain why lock-screen / media
/// controls are missing if [AudioService.init] fails (it silently falls back
/// to a bare handler otherwise).
bool mediaSessionAvailable = true;
String mediaSessionError = '';

Future<GalaAudioHandler> initMediaSession() async {
  try {
    final handler = await AudioService.init<GalaAudioHandler>(
      builder: () => GalaAudioHandler(),
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'com.galasang.gala_sang.channel.audio',
        androidNotificationChannelName: 'Gala Sang',
        androidNotificationIcon: 'drawable/ic_stat_gala_sang',
        androidStopForegroundOnPause: true,
        androidNotificationOngoing: true,
        fastForwardInterval: Duration(seconds: 10),
        rewindInterval: Duration(seconds: 10),
      ),
    );
    mediaSessionAvailable = true;
    mediaSessionError = '';
    return handler;
  } catch (e) {
    // Never let audio-service setup block or kill the app: fall back to a
    // bare handler so playback still works (just without lock-screen media).
    mediaSessionAvailable = false;
    mediaSessionError = e.toString();
    return GalaAudioHandler();
  }
}