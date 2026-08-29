import { NextRequest, NextResponse } from "next/server";
import {pool} from '@/lib/create_pool'; //import pool to only create it once, not for every request
import { getPreviewLink } from "@/lib/deezer_utils";

interface DBRow{
    id: number,
    title: string,
    artist: string,
    year: number,
    track_id: number
}

const MAX_ATTEMPTS = 10;

export async function GET(req: NextRequest){

    function getRandomInt(min: number, max: number): number {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    let attempts = 0;

    //get a random number from 556 to 1289 => random song id

    let found: boolean = false;
    let data: DBRow| null = null;
    let previewLink = null;

    while(!found && attempts < MAX_ATTEMPTS){
        attempts++;
        try{

            //get a random song from the db
            let result = await pool.query('select id, title, artist, year, track_id from songs order by random() limit 1');
            if(result.rowCount === 0)
                throw new Error('Id not found');

            data = result.rows[0];
            if(!data)
                throw new Error('Empty data')
            //check if the trackId is already in a redis instance - if it is, it means that the song is still inactive - cannot be used until ttl to avoid repeating songs
            //throw error if in redis

            //get the preview link of the song
            previewLink = await getPreviewLink(data.track_id);

            found = true;

        }catch(err: any){
            console.error('Attempt failed:', err.message);
            found = false;
        }
    }

    //If data is null, it means the while loop was exited because number of max attempts was reached
    if(!found || !data){
        return NextResponse.json({error: 'Could not find a song'}, {status: 500})
    }

    return NextResponse.json({success: true, message: 'Song successfully retrieved', data: {...data, previewLink: previewLink}}, {status: 200});

}