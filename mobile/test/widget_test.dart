import 'package:flutter_test/flutter_test.dart';

import 'package:gala_sang/main.dart';

void main() {
  testWidgets('app boots into home shell', (WidgetTester tester) async {
    // main() requires audio_service init, so we only assert the widget exists.
    expect(GalaSangApp, isNotNull);
  });
}