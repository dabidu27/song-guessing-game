import { NextRequest, NextResponse } from "next/server";
import {pool} from '@/lib/create_pool'; //import pool to only create it once, not for every request
import { getPreviewLink } from "@/lib/deezer_utils";
import { checkSong, setSongInactive } from "@/lib/redis_utils";

interface DBRow{
    id: number,
    title: string,
    artist: string,
    year: number,
    track_id: number
}

const MAX_ATTEMPTS = 10;

export async function GET(req: NextRequest, {params}: {params: Promise<{clientId: string}>}){

    const {clientId} = await params;
    if(!clientId){
        return NextResponse.json({error: 'Forbidden'}, {status: 400});
    }

    let attempts = 0;

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

            
            let trackId = data.track_id;
            //check if the trackId is already in a redis instance - if it is, it means that the song is still inactive - cannot be used until ttl to avoid repeating songs
            let inactive = await checkSong(clientId, trackId);
            //throw error if in redis
            if(inactive){
                throw new Error('Song is inactive');
            }

            //get the preview link of the song
            previewLink = await getPreviewLink(trackId);

            found = true;
            await setSongInactive(clientId, trackId);

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