import {Redis} from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const EXP_DURATION = 60 * 60 * 48; //2 days per (clientId, trackId) pair

export async function setSongInactive(clientId: string, trackId: number){

   const key = `used:${clientId}-${trackId}`;
   await redis.set(key, '1', {ex: EXP_DURATION});
}

export async function checkSong(clientId: string, trackId: number){

    const key = `used:${clientId}-${trackId}`;
    const inactive = await redis.get(key);
    if(!inactive){
        return false;
    }
    return true;

}