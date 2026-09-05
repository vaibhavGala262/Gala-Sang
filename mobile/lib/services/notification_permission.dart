import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

/// Android 13+ requires POST_NOTIFICATIONS before the media notification can
/// appear (audio_service cannot show it otherwise). On older Android / other
/// platforms this resolves immediately.
Future<bool> ensureNotificationPermission() async {
  if (kIsWeb) return true;
  try {
    if (Platform.isAndroid) {
      final status = await Permission.notification.request();
      return status.isGranted;
    }
    if (Platform.isIOS) {
      final status = await Permission.notification.request();
      return status.isGranted || status.isLimited;
    }
  } catch (_) {
    return false;
  }
  return true;
}