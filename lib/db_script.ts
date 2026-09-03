import {Pool} from 'pg';
import { parseCsv } from './dataset_utils';
import { getTrackId } from './deezer_utils';
import { songsArray } from './songs_array';
import fs from 'fs'
import 'dotenv/config';

const pool = new Pool({connectionString: process.env.DATABASE_URL});

interface Song{
  trackName: string,
  mainArtist: string,
  //year: number,
}

function normalize(text: string): string {
    const withoutTags = text
        //remove " - YYYY Remaster" or " - Remastered YYYY"
        .replace(/\s[-–—]\s\d{4}\sRemaster.*/i, '')
        .replace(/\s[-–—]\sRemaster.*/i, '')
        //remove " (feat. Artist)" or " [feat. Artist]"
        .replace(/\s[\(\[].*?feat\..*?[\)\]]/i, '')
        //remove " - Radio Edit" or " - Single Version"
        .replace(/\s-\s(?:Radio Edit|Single Version|Live).*/i, '')
        //clean up any accidental double spaces left behind
        .replace(/\s{2,}/g, ' ')
        .trim();

    //remove diacritics (e.g., ă -> a, ș -> s, ț -> t)
    return withoutTags
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

async function fillDb(){

    //const songs: Song[] = parseCsv();
    const rawData = fs.readFileSync('./spotify_backup.json', 'utf-8');
    const songs: Song[] = JSON.parse(rawData);

    for(const song of songs){
        try{

            const cleanTitle = normalize(song.trackName);
            const cleanArtist = normalize(song.mainArtist);

            console.log(`Searching Deezer for: "${cleanTitle}" by "${cleanArtist}"`);
            
            //No preview link => throws error => song is skipped
            const deezerData = await getTrackId(cleanArtist, cleanTitle);

            const result = await pool.query(`insert into songs_spotify(title, artist, year, track_id) values($1, $2, $3, $4)
                on conflict (track_id)
                do update set title = EXCLUDED.title, artist = EXCLUDED.artist, year = EXCLUDED.year`, 
                [cleanTitle, cleanArtist, 2026, deezerData.trackId]
            ); //upsert - for songs that were in multiple playlists

            if(result.rowCount === 0){
                console.error('Failed to insert song ', song.trackName)
            }
            
            //wait to avoid rate limit
            await new Promise(res => setTimeout(res, 500));

        }catch(err: any){
            console.log(`\n❌ --- ERROR DETAILS FOR "${song.trackName}" ---`);
            console.error(err);
            console.log(`-------------------------------------------\n`);
        }
    }

    await pool.end();
}

fillDb();