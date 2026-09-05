import 'package:flutter/material.dart';

/// App-wide messenger so non-widget code (e.g. PlayerController) can surface
/// brief SnackBars like repeat-mode changes.
final GlobalKey<ScaffoldMessengerState> appMessengerKey =
    GlobalKey<ScaffoldMessengerState>();