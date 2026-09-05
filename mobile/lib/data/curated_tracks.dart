import '../models/track.dart';
import 'curated_tracks.g.dart';

List<Track> _convert(List<Map<String, dynamic>> raw) =>
    raw.map((m) => Track.fromMap(m)).toList();

final List<Track> bollywoodTopHits = _convert(bollywoodTopHitsRaw);
final List<Track> bollywoodRetroClassics = _convert(bollywoodRetroClassicsRaw);
final List<Track> punjabiSuperhits = _convert(punjabiSuperhitsRaw);
final List<Track> liveRadioStations = _convert(liveRadioStationsRaw);
final List<Track> englishTop100 = _convert(englishTop100Raw);
final List<Track> englishTopHits = englishTop100.take(16).toList();

/// Everything curated: used as the initial "home" browse + search fallback.
final List<Track> curatedTracks = <Track>[
  ...bollywoodTopHits,
  ...englishTop100,
  ...bollywoodRetroClassics,
  ...punjabiSuperhits,
  ...liveRadioStations,
];

/// Default "people are searching" pool that shows before any typed query.
final List<Track> defaultBrowseTracks = <Track>[
  ...bollywoodTopHits,
  ...englishTopHits,
  ...liveRadioStations,
];

class QuickTag {
  final String label;
  final String query;
  const QuickTag(this.label, this.query);
}

const List<QuickTag> quickTags = <QuickTag>[
  QuickTag('English Top 100', 'The Weeknd'),
  QuickTag('Bollywood Hits', 'Bollywood'),
  QuickTag('Alan Walker', 'Alan Walker'),
  QuickTag('Imagine Dragons', 'Imagine Dragons'),
  QuickTag('Ed Sheeran', 'Ed Sheeran'),
  QuickTag('Taylor Swift', 'Taylor Swift'),
  QuickTag('Punjabi Hits', 'Punjabi'),
  QuickTag('Live HD Radios', 'Radio'),
  QuickTag('Coldplay', 'Coldplay'),
];

/// Sections shown on the Home screen.
class HomeSection {
  final String title;
  final List<Track> tracks;
  const HomeSection(this.title, this.tracks);
}

final List<HomeSection> homeSections = <HomeSection>[
  HomeSection('Bollywood & Desi', bollywoodTopHits),
  HomeSection('English Top Hits', englishTopHits),
  HomeSection('Retro Classics', bollywoodRetroClassics),
  HomeSection('Punjabi Superhits', punjabiSuperhits),
  HomeSection('Live HD Radios', liveRadioStations),
];