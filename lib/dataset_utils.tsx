import fs from 'fs';
import Papa from 'papaparse';

interface Row {
 track_name: string,
  'artist(s)_name': string,
  artist_count: number,
  released_year: number,
  released_month: number,
  released_day: number,
  in_spotify_playlists: number,
  in_spotify_charts: number,
  streams: number,
  in_apple_playlists: number,
  in_apple_charts: number,
  in_deezer_playlists: number,
  in_deezer_charts: number,
  in_shazam_charts: number,
  bpm: number,
  key: string,
  mode: string,
  'danceability_%': number,
  'valence_%': number,
  'energy_%': number,
  'acousticness_%': number,
  'instrumentalness_%': number,
  'liveness_%': number,
  'speechiness_%': number,
  cover_url: string
}

interface UsefulRow{
  track_name: string,
  mainArtist: string,
  year: number,
}
//Function to read the data from the csv
export function parseCsv(){

    const fileContent = fs.readFileSync('/Users/dabid/Desktop/andrada_game/game/Spotify Most Streamed Songs.csv', 'utf-8');
    const {data, errors} = Papa.parse<Row>(fileContent, {
            header: true, //use header rows as keys
            skipEmptyLines: true,
            dynamicTyping: true //auto-conver numeric strings (like popularity for example) to numbers
        }
    )

    if(errors.length > 0){
        console.error('Parse errors: ', errors.slice(0, 5));
        throw new Error('CSV parsing errors');
    }

    if(data.length === 0){
        throw new Error('Empty CSV');
    }

    const usefulData: UsefulRow[]  = [];
    data.forEach((r: Row) => usefulData.push({track_name: r.track_name, mainArtist: r['artist(s)_name'].split(',')[0].trim(), year: r.released_year}));

    return usefulData;
}