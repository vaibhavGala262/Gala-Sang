import 'track.dart';

class Playlist {
  final String id;
  String name;
  String description;
  String? coverImage;
  final List<Track> tracks;
  final int createdAt;

  Playlist({
    required this.id,
    required this.name,
    this.description = '',
    this.coverImage,
    required this.tracks,
    required this.createdAt,
  });

  factory Playlist.fromMap(Map<String, dynamic> m) {
    final rawTracks = m['tracks'] as List<dynamic>? ?? <dynamic>[];
    return Playlist(
      id: m['id'] as String,
      name: m['name'] as String,
      description: m['description'] as String? ?? '',
      coverImage: m['coverImage'] as String?,
      tracks: rawTracks
          .map((e) => Track.fromMap((e as Map).cast<String, dynamic>()))
          .toList(),
      createdAt: (m['createdAt'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'description': description,
      'coverImage': coverImage,
      'tracks': tracks.map((t) => t.toMap()).toList(),
      'createdAt': createdAt,
    };
  }
}