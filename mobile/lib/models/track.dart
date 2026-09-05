class Track {
  final String id;
  final String title;
  final String artist;
  final String? album;
  final String artwork;
  final String audioUrl;
  final int duration;
  final String? genre;
  final int? releaseYear;
  final bool? isLiveRadio;
  final bool? isLocal;
  final String? youtubeVideoId;
  final String? radioFrequency;
  final String? radioLocation;
  final String? radioCategory;
  final String source;

  const Track({
    required this.id,
    required this.title,
    required this.artist,
    this.album,
    required this.artwork,
    required this.audioUrl,
    required this.duration,
    this.genre,
    this.releaseYear,
    this.isLiveRadio,
    this.isLocal,
    this.youtubeVideoId,
    this.radioFrequency,
    this.radioLocation,
    this.radioCategory,
    required this.source,
  });

  factory Track.fromMap(Map<String, dynamic> m) {
    return Track(
      id: m['id'] as String? ?? '',
      title: m['title'] as String? ?? 'Unknown Song',
      artist: m['artist'] as String? ?? 'Unknown Artist',
      album: m['album'] as String?,
      artwork: m['artwork'] as String? ??
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      audioUrl: m['audioUrl'] as String? ?? '',
      duration: (m['duration'] as num?)?.toInt() ?? 0,
      genre: m['genre'] as String?,
      releaseYear: (m['releaseYear'] as num?)?.toInt(),
      isLiveRadio: m['isLiveRadio'] as bool?,
      isLocal: m['isLocal'] as bool?,
      youtubeVideoId: m['youtubeVideoId'] as String?,
      radioFrequency: m['radioFrequency'] as String?,
      radioLocation: m['radioLocation'] as String?,
      radioCategory: m['radioCategory'] as String?,
      source: m['source'] as String? ?? 'jiosaavn',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'title': title,
      'artist': artist,
      'album': album,
      'artwork': artwork,
      'audioUrl': audioUrl,
      'duration': duration,
      'genre': genre,
      'releaseYear': releaseYear,
      'isLiveRadio': isLiveRadio,
      'isLocal': isLocal,
      'youtubeVideoId': youtubeVideoId,
      'radioFrequency': radioFrequency,
      'radioLocation': radioLocation,
      'radioCategory': radioCategory,
      'source': source,
    };
  }

  bool get isRadio => isLiveRadio ?? false;

  @override
  bool operator ==(Object other) => other is Track && other.id == id;

  @override
  int get hashCode => id.hashCode;
}