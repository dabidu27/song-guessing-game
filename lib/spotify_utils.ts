

export async function getSongsFromPlaylists(){

    const accessToken = process.env.SPOTIFY_USER_TOKEN!;
    const songs: any[] = [];

    const playlistIdsRes = await fetch('https://api.spotify.com/v1/me/playlists',
        {headers: {"Authorization": `Bearer ${accessToken}`}}
    )

    const skipThesePlaylists = [
        'METALCORE 2026', 'NU METAL EDGE', 'Punk-O-Rama fav', 'Playlist OpelAstra', 
        'la multi ani raluca', 'cool girl fall', 'makeout sesh ', 'mid 90s', 
        'My Playlist #45', 'city pop ', 'zara??!?!?!?', 'an actually accurate eddie munson playlist', 
        'Rather be dead ', 'coming of age', 'Indigo Night', 'space out make out', 
        'Creep', 'humid summer nights by a pretty body of water', 'radiohead.'
    ];

    let playlistIdsData = await playlistIdsRes.json();
   
    playlistIdsData = playlistIdsData.items.filter((pd: any) => !skipThesePlaylists.includes(pd.name));
    const playlistIds = playlistIdsData.map((pd: any) => pd.id);
    console.log(playlistIds);
    console.log(`Found ${playlistIds.length} playlists to process...`);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    for(const playlistId of playlistIds){

        const playlistsRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items`, 
         {headers: {"Authorization": `Bearer ${accessToken}`}}
        )

        if(playlistsRes.status === 429){
            let retryAfter = playlistsRes.headers.get('retry-after');
            console.error(`Rate limit hit. Retry-after: ${retryAfter}. Aborting`);
            throw new Error(`Rate limit hit. Retry-after: ${retryAfter}. Aborting`);
        }

        const playlistsData = await playlistsRes.json();
        
        //safeguard - if spotify returns an error (like rate limit) log and skip to the next playlist
        if (playlistsData.error) {
            console.error(`Error fetching playlist ${playlistId}:`, playlistsData.error.message);
            continue; 
        }

        const songsData = playlistsData.items
            .map((pd: any) => pd.item)
            .filter((item: any) => item !== null);

        songsData.forEach((song: any) => {
            if (song && song.name && song.artists) {
                songs.push({trackName: song.name, mainArtist: song.artists[0].name})
            }
        });
        
        //pause for 2 seconds to avoid rate-limiting
        await delay(2000); 
    }

    console.log(`Successfully extracted ${songs.length} songs!`);
    return songs;
}
