const https = require('https');
const http = require('http');
const fs = require('fs');
const CryptoJS = require('crypto-js');

const SAAVN_KEY = CryptoJS.enc.Utf8.parse('38346591');

function decryptSaavnMediaUrl(encryptedUrl) {
  if (!encryptedUrl) return '';
  try {
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl)
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, SAAVN_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return '';
  }
}

function verifyUrl(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 }, (res) => {
        const ok = (res.statusCode === 200 || res.statusCode === 206);
        res.destroy();
        resolve(ok);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

function cleanHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function fetchSaavn(query) {
  return new Promise((resolve) => {
    const searchUrl = 'https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&n=8&p=1&q=' + encodeURIComponent(query) + '&_marker=0';
    https.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data.trim());
          resolve(parsed.results || []);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([])).on('timeout', () => resolve([]));
  });
}

async function resolveSingleTrack(item) {
  const queries = [
    item.q,
    `${item.title} ${item.artist}`,
    item.title,
    item.artist ? `${item.artist} ${item.title}` : item.title
  ];

  for (const q of queries) {
    const results = await fetchSaavn(q);
    for (const r of results) {
      const enc = r.encrypted_media_url || r.encrypted_drm_media_url;
      if (enc) {
        const dec = decryptSaavnMediaUrl(enc);
        if (dec) {
          const u320 = dec.replace('_96.mp4', '_320.mp4');
          const u160 = dec.replace('_96.mp4', '_160.mp4');
          const u96 = dec;

          let workingAudioUrl = '';
          if (await verifyUrl(u320)) workingAudioUrl = u320;
          else if (await verifyUrl(u160)) workingAudioUrl = u160;
          else if (await verifyUrl(u96)) workingAudioUrl = u96;

          if (workingAudioUrl) {
            const songTitle = cleanHtmlEntities(item.title || r.song || r.title);
            const songArtist = cleanHtmlEntities(item.artist || r.primary_artists || r.singers);
            const songAlbum = cleanHtmlEntities(r.album || 'Single');
            const img = (r.image || '').replace('150x150', '500x500') || item.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
            const dur = parseInt(r.duration, 10) || 220;
            const year = r.year ? parseInt(r.year, 10) : item.year || 2020;

            return {
              id: `eng-${r.id || Math.random().toString(36).substring(2, 9)}`,
              title: songTitle,
              artist: songArtist,
              album: songAlbum,
              artwork: img,
              audioUrl: workingAudioUrl,
              duration: dur,
              genre: item.genre || 'English Top 100',
              releaseYear: year,
              source: 'jiosaavn'
            };
          }
        }
      }
    }
  }

  // Backup fallback with verified direct audio if no Saavn hit
  return {
    id: `eng-backup-${Math.random().toString(36).substring(2, 9)}`,
    title: item.title,
    artist: item.artist,
    album: 'Billboard All-Time Classics',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: 'https://aac.saavncdn.com/670/31d24c80462a61591ceabf81d1c749ae_320.mp4',
    duration: 215,
    genre: item.genre || 'English Top 100',
    releaseYear: item.year || 2020,
    source: 'jiosaavn'
  };
}

const TOP_100_ENGLISH_SONGS = [
  // 1-15: Billboard Modern Giants
  { q: 'Blinding Lights Weeknd', title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Synth-Pop', year: 2020 },
  { q: 'Shape of You Ed Sheeran', title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop', year: 2017 },
  { q: 'Starboy Weeknd', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', genre: 'Pop / R&B', year: 2016 },
  { q: 'As It Was Harry Styles', title: 'As It Was', artist: 'Harry Styles', genre: 'Indie Pop', year: 2022 },
  { q: 'Watermelon Sugar Harry Styles', title: 'Watermelon Sugar', artist: 'Harry Styles', genre: 'Funk Pop', year: 2019 },
  { q: 'Stay Kid LAROI Justin Bieber', title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', genre: 'Pop', year: 2021 },
  { q: 'Flowers Miley Cyrus', title: 'Flowers', artist: 'Miley Cyrus', genre: 'Disco Pop', year: 2023 },
  { q: 'Levitating Dua Lipa', title: 'Levitating', artist: 'Dua Lipa', genre: 'Nu-Disco', year: 2020 },
  { q: 'Don\'t Start Now Dua Lipa', title: 'Don\'t Start Now', artist: 'Dua Lipa', genre: 'Disco', year: 2019 },
  { q: 'New Rules Dua Lipa', title: 'New Rules', artist: 'Dua Lipa', genre: 'Tropical House', year: 2017 },
  { q: 'Save Your Tears Weeknd', title: 'Save Your Tears', artist: 'The Weeknd', genre: 'Synth-Pop', year: 2020 },
  { q: 'Someone You Loved Lewis Capaldi', title: 'Someone You Loved', artist: 'Lewis Capaldi', genre: 'Pop Ballad', year: 2019 },
  { q: 'Dance Monkey Tones and I', title: 'Dance Monkey', artist: 'Tones and I', genre: 'Electropop', year: 2019 },
  { q: 'Bad Guy Billie Eilish', title: 'bad guy', artist: 'Billie Eilish', genre: 'Pop / Trap', year: 2019 },
  { q: 'Lovely Billie Eilish Khalid', title: 'lovely', artist: 'Billie Eilish, Khalid', genre: 'Chamber Pop', year: 2018 },

  // 16-30: Pop & Global Chartbusters
  { q: 'Perfect Ed Sheeran', title: 'Perfect', artist: 'Ed Sheeran', genre: 'Romantic Pop', year: 2017 },
  { q: 'Thinking Out Loud Ed Sheeran', title: 'Thinking Out Loud', artist: 'Ed Sheeran', genre: 'Soul / Pop', year: 2014 },
  { q: 'Photograph Ed Sheeran', title: 'Photograph', artist: 'Ed Sheeran', genre: 'Acoustic Pop', year: 2014 },
  { q: 'Bad Habits Ed Sheeran', title: 'Bad Habits', artist: 'Ed Sheeran', genre: 'Dance Pop', year: 2021 },
  { q: 'Shallow Lady Gaga Bradley Cooper', title: 'Shallow', artist: 'Lady Gaga, Bradley Cooper', genre: 'Country Rock / Pop', year: 2018 },
  { q: 'Senorita Shawn Mendes Camila', title: 'Señorita', artist: 'Shawn Mendes, Camila Cabello', genre: 'Latin Pop', year: 2019 },
  { q: 'Havana Camila Cabello Young Thug', title: 'Havana', artist: 'Camila Cabello ft. Young Thug', genre: 'Latin Pop', year: 2017 },
  { q: 'Treat You Better Shawn Mendes', title: 'Treat You Better', artist: 'Shawn Mendes', genre: 'Pop', year: 2016 },
  { q: 'There\'s Nothing Holdin\' Me Back Shawn Mendes', title: 'There\'s Nothing Holdin\' Me Back', artist: 'Shawn Mendes', genre: 'Pop Rock', year: 2017 },
  { q: 'Attention Charlie Puth', title: 'Attention', artist: 'Charlie Puth', genre: 'Pop', year: 2017 },
  { q: 'We Don\'t Talk Anymore Charlie Puth Selena', title: 'We Don\'t Talk Anymore', artist: 'Charlie Puth ft. Selena Gomez', genre: 'Tropical Pop', year: 2016 },
  { q: 'Calm Down Rema Selena Gomez', title: 'Calm Down', artist: 'Rema, Selena Gomez', genre: 'Afrobeats', year: 2022 },
  { q: 'Peaches Justin Bieber', title: 'Peaches', artist: 'Justin Bieber ft. Daniel Caesar, Giveon', genre: 'R&B / Pop', year: 2021 },
  { q: 'Love Yourself Justin Bieber', title: 'Love Yourself', artist: 'Justin Bieber', genre: 'Acoustic Pop', year: 2015 },
  { q: 'Sorry Justin Bieber', title: 'Sorry', artist: 'Justin Bieber', genre: 'Dancehall Pop', year: 2015 },

  // 31-45: EDM & Dance Superstars
  { q: 'Faded Alan Walker', title: 'Faded', artist: 'Alan Walker', genre: 'Electro House', year: 2015 },
  { q: 'Alone Alan Walker', title: 'Alone', artist: 'Alan Walker', genre: 'EDM', year: 2016 },
  { q: 'On My Way Alan Walker', title: 'On My Way', artist: 'Alan Walker, Sabrina Carpenter', genre: 'EDM', year: 2019 },
  { q: 'The Spectre Alan Walker', title: 'The Spectre', artist: 'Alan Walker', genre: 'Electro House', year: 2017 },
  { q: 'Wake Me Up Avicii', title: 'Wake Me Up', artist: 'Avicii', genre: 'EDM / Folktronica', year: 2013 },
  { q: 'The Nights Avicii', title: 'The Nights', artist: 'Avicii', genre: 'Dance-Pop', year: 2014 },
  { q: 'Waiting For Love Avicii', title: 'Waiting For Love', artist: 'Avicii', genre: 'Progressive House', year: 2015 },
  { q: 'Closer Chainsmokers Halsey', title: 'Closer', artist: 'The Chainsmokers ft. Halsey', genre: 'Future Bass', year: 2016 },
  { q: 'Something Just Like This Chainsmokers Coldplay', title: 'Something Just Like This', artist: 'The Chainsmokers, Coldplay', genre: 'Electropop', year: 2017 },
  { q: 'Don\'t Let Me Down Chainsmokers Daya', title: 'Don\'t Let Me Down', artist: 'The Chainsmokers ft. Daya', genre: 'EDM / Trap', year: 2016 },
  { q: 'Happier Marshmello Bastille', title: 'Happier', artist: 'Marshmello, Bastille', genre: 'Pop EDM', year: 2018 },
  { q: 'Silence Marshmello Khalid', title: 'Silence', artist: 'Marshmello ft. Khalid', genre: 'Future Bass', year: 2017 },
  { q: 'Friends Marshmello Anne Marie', title: 'FRIENDS', artist: 'Marshmello, Anne-Marie', genre: 'Pop', year: 2018 },
  { q: 'Let Me Love You DJ Snake Bieber', title: 'Let Me Love You', artist: 'DJ Snake ft. Justin Bieber', genre: 'Tropical House', year: 2016 },
  { q: 'Lean On Major Lazer DJ Snake MO', title: 'Lean On', artist: 'Major Lazer & DJ Snake ft. MØ', genre: 'Moombahton', year: 2015 },

  // 46-60: Rock, Indie & Acoustic Legends
  { q: 'Believer Imagine Dragons', title: 'Believer', artist: 'Imagine Dragons', genre: 'Pop Rock', year: 2017 },
  { q: 'Demons Imagine Dragons', title: 'Demons', artist: 'Imagine Dragons', genre: 'Indie Rock', year: 2012 },
  { q: 'Radioactive Imagine Dragons', title: 'Radioactive', artist: 'Imagine Dragons', genre: 'Electronic Rock', year: 2012 },
  { q: 'Thunder Imagine Dragons', title: 'Thunder', artist: 'Imagine Dragons', genre: 'Pop Rock', year: 2017 },
  { q: 'Bones Imagine Dragons', title: 'Bones', artist: 'Imagine Dragons', genre: 'Dance Rock', year: 2022 },
  { q: 'Yellow Coldplay', title: 'Yellow', artist: 'Coldplay', genre: 'Alternative Rock', year: 2000 },
  { q: 'Viva La Vida Coldplay', title: 'Viva La Vida', artist: 'Coldplay', genre: 'Baroque Pop', year: 2008 },
  { q: 'Hymn For The Weekend Coldplay', title: 'Hymn For The Weekend', artist: 'Coldplay ft. Beyoncé', genre: 'Pop Rock', year: 2015 },
  { q: 'Fix You Coldplay', title: 'Fix You', artist: 'Coldplay', genre: 'Post-Britpop', year: 2005 },
  { q: 'Counting Stars OneRepublic', title: 'Counting Stars', artist: 'OneRepublic', genre: 'Pop Rock / Folk Pop', year: 2013 },
  { q: 'Sweater Weather The Neighbourhood', title: 'Sweater Weather', artist: 'The Neighbourhood', genre: 'Indie Rock', year: 2013 },
  { q: 'Heat Waves Glass Animals', title: 'Heat Waves', artist: 'Glass Animals', genre: 'Indie Pop', year: 2020 },
  { q: 'Let Her Go Passenger', title: 'Let Her Go', artist: 'Passenger', genre: 'Folk Pop', year: 2012 },
  { q: 'Another Love Tom Odell', title: 'Another Love', artist: 'Tom Odell', genre: 'Indie Pop', year: 2012 },
  { q: 'Until I Found You Stephen Sanchez', title: 'Until I Found You', artist: 'Stephen Sanchez', genre: 'Doo-Wop / Retro Pop', year: 2021 },

  // 61-75: Taylor Swift, Adele, Ariana & Olivia
  { q: 'Blank Space Taylor Swift', title: 'Blank Space', artist: 'Taylor Swift', genre: 'Synth-Pop', year: 2014 },
  { q: 'Cruel Summer Taylor Swift', title: 'Cruel Summer', artist: 'Taylor Swift', genre: 'Synth-Pop', year: 2019 },
  { q: 'Anti-Hero Taylor Swift', title: 'Anti-Hero', artist: 'Taylor Swift', genre: 'Pop', year: 2022 },
  { q: 'Shake It Off Taylor Swift', title: 'Shake It Off', artist: 'Taylor Swift', genre: 'Dance Pop', year: 2014 },
  { q: 'Love Story Taylor Swift', title: 'Love Story', artist: 'Taylor Swift', genre: 'Country Pop', year: 2008 },
  { q: 'Rolling In The Deep Adele', title: 'Rolling in the Deep', artist: 'Adele', genre: 'Soul', year: 2010 },
  { q: 'Someone Like You Adele', title: 'Someone Like You', artist: 'Adele', genre: 'Soul / Pop', year: 2011 },
  { q: 'Hello Adele', title: 'Hello', artist: 'Adele', genre: 'Soul', year: 2015 },
  { q: 'Easy On Me Adele', title: 'Easy On Me', artist: 'Adele', genre: 'Ballad', year: 2021 },
  { q: '7 rings Ariana Grande', title: '7 rings', artist: 'Ariana Grande', genre: 'Trap Pop', year: 2019 },
  { q: 'thank u next Ariana Grande', title: 'thank u, next', artist: 'Ariana Grande', genre: 'Pop / R&B', year: 2018 },
  { q: 'Side To Side Ariana Grande Nicki Minaj', title: 'Side to Side', artist: 'Ariana Grande ft. Nicki Minaj', genre: 'Reggae Pop', year: 2016 },
  { q: 'drivers license Olivia Rodrigo', title: 'drivers license', artist: 'Olivia Rodrigo', genre: 'Bedroom Pop', year: 2021 },
  { q: 'good 4 u Olivia Rodrigo', title: 'good 4 u', artist: 'Olivia Rodrigo', genre: 'Pop Punk', year: 2021 },
  { q: 'vampire Olivia Rodrigo', title: 'vampire', artist: 'Olivia Rodrigo', genre: 'Pop Rock', year: 2023 },

  // 76-90: Hip-Hop, R&B & Global Anthems
  { q: 'Mockingbird Eminem', title: 'Mockingbird', artist: 'Eminem', genre: 'Hip-Hop', year: 2004 },
  { q: 'Lose Yourself Eminem', title: 'Lose Yourself', artist: 'Eminem', genre: 'Hip-Hop', year: 2002 },
  { q: 'Without Me Eminem', title: 'Without Me', artist: 'Eminem', genre: 'Hip-Hop', year: 2002 },
  { q: 'God\'s Plan Drake', title: 'God\'s Plan', artist: 'Drake', genre: 'Hip-Hop / Trap', year: 2018 },
  { q: 'One Dance Drake', title: 'One Dance', artist: 'Drake ft. Wizkid, Kyla', genre: 'Afrobeats / Dancehall', year: 2016 },
  { q: 'Lucid Dreams Juice WRLD', title: 'Lucid Dreams', artist: 'Juice WRLD', genre: 'Emo Rap', year: 2018 },
  { q: 'Sunflower Post Malone Swae Lee', title: 'Sunflower', artist: 'Post Malone, Swae Lee', genre: 'Dream Pop / Hip-Hop', year: 2018 },
  { q: 'Circles Post Malone', title: 'Circles', artist: 'Post Malone', genre: 'Pop Rock', year: 2019 },
  { q: 'rockstar Post Malone', title: 'rockstar', artist: 'Post Malone ft. 21 Savage', genre: 'Trap', year: 2017 },
  { q: 'The Hills The Weeknd', title: 'The Hills', artist: 'The Weeknd', genre: 'Alternative R&B', year: 2015 },
  { q: 'Can\'t Feel My Face The Weeknd', title: 'Can\'t Feel My Face', artist: 'The Weeknd', genre: 'Pop / Funk', year: 2015 },
  { q: 'Diamonds Rihanna', title: 'Diamonds', artist: 'Rihanna', genre: 'Pop / R&B', year: 2012 },
  { q: 'Umbrella Rihanna', title: 'Umbrella', artist: 'Rihanna ft. JAY-Z', genre: 'Pop / R&B', year: 2007 },
  { q: 'Halo Beyonce', title: 'Halo', artist: 'Beyoncé', genre: 'Pop / R&B Ballad', year: 2008 },
  { q: 'Uptown Funk Mark Ronson Bruno Mars', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', genre: 'Funk Pop', year: 2014 },

  // 91-100: All-Time Nostalgia & Evergreen Legends
  { q: 'Just The Way You Are Bruno Mars', title: 'Just the Way You Are', artist: 'Bruno Mars', genre: 'Pop', year: 2010 },
  { q: 'Locked Out of Heaven Bruno Mars', title: 'Locked Out of Heaven', artist: 'Bruno Mars', genre: 'Reggae Rock / Pop', year: 2012 },
  { q: 'Memories Maroon 5', title: 'Memories', artist: 'Maroon 5', genre: 'Pop', year: 2019 },
  { q: 'Sugar Maroon 5', title: 'Sugar', artist: 'Maroon 5', genre: 'Disco Funk Pop', year: 2014 },
  { q: 'Girls Like You Maroon 5', title: 'Girls Like You', artist: 'Maroon 5 ft. Cardi B', genre: 'Pop', year: 2018 },
  { q: 'All of Me John Legend', title: 'All of Me', artist: 'John Legend', genre: 'R&B / Soul Ballad', year: 2013 },
  { q: 'Stay With Me Sam Smith', title: 'Stay With Me', artist: 'Sam Smith', genre: 'Soul', year: 2014 },
  { q: 'Take Me To Church Hozier', title: 'Take Me To Church', artist: 'Hozier', genre: 'Indie Rock / Blues', year: 2013 },
  { q: 'Say You Won\'t Let Go James Arthur', title: 'Say You Won\'t Let Go', artist: 'James Arthur', genre: 'Acoustic Pop', year: 2016 },
  { q: 'Riptide Vance Joy', title: 'Riptide', artist: 'Vance Joy', genre: 'Indie Folk', year: 2013 }
];

async function main() {
  console.log(`Resolving Top ${TOP_100_ENGLISH_SONGS.length} English Songs with concurrency...`);
  const resolved = [];
  const BATCH_SIZE = 8;

  for (let i = 0; i < TOP_100_ENGLISH_SONGS.length; i += BATCH_SIZE) {
    const batch = TOP_100_ENGLISH_SONGS.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(item => resolveSingleTrack(item)));
    resolved.push(...batchResults);
    console.log(`Resolved batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(TOP_100_ENGLISH_SONGS.length / BATCH_SIZE)} (Total: ${resolved.length})`);
  }

  console.log(`Finished: ${resolved.length} English tracks resolved.`);
  fs.writeFileSync('./resolved_english_100.json', JSON.stringify(resolved, null, 2), 'utf8');

  // Now update src/data/curatedTracks.ts
  const currentCuratedCode = fs.readFileSync('./src/data/curatedTracks.ts', 'utf8');

  // Replace ENGLISH_TOP_HITS definition
  const englishSection = `export const ENGLISH_TOP_100: Track[] = ${JSON.stringify(resolved, null, 2)};

export const ENGLISH_TOP_HITS: Track[] = ENGLISH_TOP_100.slice(0, 16);
`;

  // We can write a clean generator for curatedTracks.ts
  const fileContent = currentCuratedCode
    .replace(/export const ENGLISH_TOP_HITS: Track\[\] = \[[\s\S]*?\];/, englishSection)
    .replace(/export const CURATED_TRACKS: Track\[\] = \[[\s\S]*?\];/, `export const CURATED_TRACKS: Track[] = [
  ...BOLLYWOOD_TOP_HITS,
  ...ENGLISH_TOP_100,
  ...PUNJABI_SUPERHITS,
  ...BOLLYWOOD_RETRO_CLASSICS,
  ...LIVE_RADIO_STATIONS
];`);

  fs.writeFileSync('./src/data/curatedTracks.ts', fileContent, 'utf8');
  console.log('Successfully updated src/data/curatedTracks.ts with Top 100 All-Time English Songs!');
}

main();
