import 'dart:convert';
import 'dart:io';

import 'package:gala_sang/services/des_ecb.dart';

void main(List<String> args) {
  final key = utf8.encode('38346591');
  for (final e in args) {
    final data = base64.decode(e);
    final raw = Des.decrypt(data, key);
    var len = raw.length;
    if (len > 0) {
      final pad = raw[len - 1];
      if (pad >= 1 && pad <= 8 && pad <= len) len -= pad;
    }
    stdout.writeln(jsonEncode(String.fromCharCodes(raw.sublist(0, len))));
  }
}