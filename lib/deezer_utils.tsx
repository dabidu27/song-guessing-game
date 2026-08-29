const DEEZER_BASE_URL = 'https://api.deezer.com'

interface songDetails{

    title: string,
    artist: string,
    previewLink: string
}
export async function getPreviewLink(artistName: string, songName: string): Promise<songDetails>{

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

    return {title: songData.title, artist: songData.artist.name, previewLink: songData.preview};
    
}