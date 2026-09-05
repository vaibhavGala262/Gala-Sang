import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color accent = Color(0xFFF27D26);
  static const Color bg = Color(0xFF050505);
  static const Color surface = Color(0xFF0D0D0D);
  static const Color surfaceRaised = Color(0xFF141414);
  static const Color surfaceSoft = Color(0xFF111111);
  static const Color textPrimary = Color(0xFFE0E0E0);
  static const Color textSecondary = Color(0xB3E0E0E0); // white with 70%
  static const Color textMuted = Color(0x66E0E0E0);     // white with 40%
}

class AppTheme {
  static ThemeData dark() {
    final base = ThemeData(brightness: Brightness.dark, useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bg,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.accent,
        secondary: AppColors.accent,
        surface: AppColors.surface,
        onSurface: AppColors.textPrimary,
        error: const Color(0xFFE5484D),
      ),
      textTheme: base.textTheme
          .apply(bodyColor: AppColors.textPrimary, displayColor: AppColors.textPrimary)
          .copyWith(
            bodyLarge: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w400),
            bodyMedium: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w400),
            bodySmall: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w400),
            titleLarge: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w600),
            headlineSmall: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700),
            headlineMedium: GoogleFonts.playfairDisplay(fontSize: 28, fontWeight: FontWeight.w700),
            labelLarge: GoogleFonts.spaceGrotesk(fontSize: 14, fontWeight: FontWeight.w700),
            labelMedium: GoogleFonts.spaceGrotesk(fontSize: 12, fontWeight: FontWeight.w700),
          ),
      iconTheme: const IconThemeData(color: AppColors.textPrimary),
      dividerColor: Colors.white12,
      sliderTheme: SliderThemeData(
        activeTrackColor: AppColors.accent,
        inactiveTrackColor: Colors.white12,
        thumbColor: AppColors.accent,
        overlayColor: AppColors.accent.withValues(alpha: 0.15),
        trackHeight: 3,
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.accent),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.surfaceRaised,
        contentTextStyle: const TextStyle(color: AppColors.textPrimary),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surfaceRaised,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surfaceRaised,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
      ),
    );
  }
}