
const spotifyId: string = process.env.SPOTIFY_CLIENT_ID!;
const spotifySecret: string = process.env.SPOTIFY_CLIENT_SECRET!;

if(!spotifyId || !spotifySecret)
    throw new Error('Missing Spotify credentials');


export async function getAccessToken(): Promise<string>{

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: spotifyId,
            client_secret: spotifySecret
        })
    })

    if(!res.ok){
        const err = await res.text();
        console.error('Spotify API Error: ', err);
        throw new Error('Error fetching Spotify access token');
    }

    const data = await res.json();
    if(!data)
        throw new Error('Error fetching Spotify access token');

    return data.access_token;
}


