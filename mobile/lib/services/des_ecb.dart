import 'dart:typed_data';

/// Minimal, dependency-free DES-ECB decryption (no padding applied by the
/// caller). Mirrors the Node `createDecipheriv('des-ecb', key)` used by the
/// web app. Validated against JioSaavn test vectors.
class Des {
  static const List<int> _ip = [
    58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4, 62, 54, 46,
    38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8, 57, 49, 41, 33, 25, 17,
    9, 1, 59, 51, 43, 35, 27, 19, 11, 3, 61, 53, 45, 37, 29, 21, 13, 5, 63,
    55, 47, 39, 31, 23, 15, 7,
  ];

  static const List<int> _fp = [
    40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31, 38, 6, 46,
    14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29, 36, 4, 44, 12, 52, 20,
    60, 28, 35, 3, 43, 11, 51, 19, 59, 27, 34, 2, 42, 10, 50, 18, 58, 26, 33,
    1, 41, 9, 49, 17, 57, 25,
  ];

  static const List<int> _e = [
    32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13, 12, 13, 14, 15,
    16, 17, 16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25, 24, 25, 26, 27, 28,
    29, 28, 29, 30, 31, 32, 1,
  ];

  static const List<int> _p = [
    16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14,
    32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25,
  ];

  static const List<int> _pc1 = [
    57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43,
    35, 27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54,
    46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
  ];

  static const List<int> _pc2 = [
    14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7,
    27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39,
    56, 34, 53, 46, 42, 50, 36, 29, 32,
  ];

  static const List<int> _shifts = [
    1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1,
  ];

  static const List<List<int>> _s = [
    [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
    [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],
    [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],
    [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],
    [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],
    [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],
    [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],
    [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11],
  ];

  static List<int> _permute(List<int> input, List<int> table) {
    return [for (final p in table) input[p - 1]];
  }

  static List<int> _rotateLeft(List<int> bits, int n) {
    final out = List<int>.of(bits);
    for (var r = 0; r < n; r++) {
      final first = out.removeAt(0);
      out.add(first);
    }
    return out;
  }

  static List<List<int>> _generateSubkeys(List<int> key64) {
    final permuted = _permute(key64, _pc1);
    var c = permuted.sublist(0, 28);
    var d = permuted.sublist(28, 56);
    final subkeys = <List<int>>[];
    for (final shift in _shifts) {
      c = _rotateLeft(c, shift);
      d = _rotateLeft(d, shift);
      subkeys.add(_permute([...c, ...d], _pc2));
    }
    return subkeys;
  }

  static List<int> _f(List<int> r, List<int> k48) {
    final expanded = _permute(r, _e);
    final xored = [for (var i = 0; i < 48; i++) expanded[i] ^ k48[i]];
    final combined = <int>[];
    for (var s = 0; s < 8; s++) {
      final chunk = xored.sublist(s * 6, s * 6 + 6);
      final row = (chunk[0] << 1) | chunk[5];
      final col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
      final val = _s[s][row * 16 + col];
      combined.add((val >> 3) & 1);
      combined.add((val >> 2) & 1);
      combined.add((val >> 1) & 1);
      combined.add(val & 1);
    }
    return _permute(combined, _p);
  }

  /// Decrypts [data] (length must be a multiple of 8 bytes) with the 8-byte
  /// [key] using DES-ECB. No padding is removed — callers handle that.
  static Uint8List decrypt(Uint8List data, Uint8List key) {
    if (data.isEmpty || data.length % 8 != 0) {
      throw ArgumentError('data must be a multiple of 8 bytes');
    }
    final keyBits = <int>[];
    for (final b in key) {
      for (var bit = 7; bit >= 0; bit--) {
        keyBits.add((b >> bit) & 1);
      }
    }
    // pad key to 8 bytes
    while (keyBits.length < 64) keyBits.add(0);
    final subkeys = _generateSubkeys(keyBits.sublist(0, 64));

    final out = Uint8List(data.length);
    for (var blockOff = 0; blockOff < data.length; blockOff += 8) {
      final bits = <int>[];
      for (var i = 0; i < 8; i++) {
        final b = data[blockOff + i];
        for (var bit = 7; bit >= 0; bit--) {
          bits.add((b >> bit) & 1);
        }
      }
      final permuted = _permute(bits, _ip);
      var l = permuted.sublist(0, 32);
      var r = permuted.sublist(32, 64);
      for (var round = 0; round < 16; round++) {
        final k = subkeys[15 - round];
        final newR = [for (var i = 0; i < 32; i++) l[i] ^ _f(r, k)[i]];
        l = r;
        r = newR;
      }
      final preOutput = [...r, ...l];
      final finalBits = _permute(preOutput, _fp);
      for (var i = 0; i < 8; i++) {
        var byte = 0;
        for (var bit = 0; bit < 8; bit++) {
          byte = (byte << 1) | finalBits[i * 8 + bit];
        }
        out[blockOff + i] = byte;
      }
    }
    return out;
  }
}