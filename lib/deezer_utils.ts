const DEEZER_BASE_URL = 'https://api.deezer.com'

interface songDetails{

    title: string,
    artist: string,
    trackId: number
}

export async function getTrackId(artistName: string, songName: string): Promise<songDetails>{

    const query = `artist:"${artistName}" track:"${songName}"`;
    const res = await fetch(`${DEEZER_BASE_URL}/search?q=${encodeURIComponent(query)}`);

    if(!res.ok){
        const err = await res.text();
        console.error(err);
        throw new Error('Error fetching Deezer response');
    }

    const data = await res.json();
    const songData = data.data[0];
    if(!songData){
        throw new Error('Song not found');
    }

    return {title: songData.title, artist: songData.artist.name, trackId: songData.id};
    
}

export async function getPreviewLink(trackId: number){

    const res = await fetch(`${DEEZER_BASE_URL}/track/${encodeURIComponent(trackId)}`);

    if(!res.ok){
        const err = await res.text();
        console.error(err);
        throw new Error('Error fetching Deezer response');
    }

    const data = await res.json();
    if (!data.preview) {
        throw new Error('No preview available for this track');
    }

    return data.preview;

}