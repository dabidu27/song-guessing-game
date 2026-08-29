import {Pool} from 'pg';
import { parseCsv } from './dataset_utils';
import { getTrackId } from './deezer_utils';

const pool = new Pool({connectionString: process.env.DATABASE_URL});

interface Song{
  trackName: string,
  mainArtist: string,
  year: number,
}

async function fillDb(){

    const songs: Song[] = parseCsv();
    for(const song of songs){
        try{
            
            //No preview link => throws error => song is skipped
            const deezerData = await getTrackId(song.mainArtist, song.trackName);

            const result = await pool.query('insert into songs(title, artist, year, track_id) values($1, $2, $3, $4)', 
                [song.trackName, song.mainArtist, song.year, deezerData.trackId]
            );

            if(result.rowCount === 0){
                console.error('Failed to insert song ', song.trackName)
            }


        }catch(err: any){
            console.error('Skipped song: ', err.message);
        }
    }

    await pool.end();
}

fillDb();