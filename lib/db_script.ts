import {Pool} from 'pg';
import { parseCsv } from './dataset_utils';
import { getTrackId } from './deezer_utils';
import { songsArray } from './songs_array';

const pool = new Pool({connectionString: process.env.DATABASE_URL});

interface Song{
  trackName: string,
  mainArtist: string,
  //year: number,
}

async function fillDb(){

    //const songs: Song[] = parseCsv();
    const songs: Song[] = songsArray;

    for(const song of songs){
        try{
            
            //No preview link => throws error => song is skipped
            const deezerData = await getTrackId(song.mainArtist, song.trackName);

            const result = await pool.query('insert into songs_spotify(title, artist, year, track_id) values($1, $2, $3, $4)', 
                [song.trackName, song.mainArtist, 2026, deezerData.trackId]
            );

            if(result.rowCount === 0){
                console.error('Failed to insert song ', song.trackName)
            }


        }catch(err: any){
            const errorMsg = typeof err === 'string' ? err : err.message;
            console.error(`Skipped song "${song.trackName}" by ${song.mainArtist}:`, errorMsg);
        }
    }

    await pool.end();
}

fillDb();