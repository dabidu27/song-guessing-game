'use client'

import { useEffect, useRef, useState } from 'react';
import { AlertCircleIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

const SNIPPET_DURATIONS = [1, 2, 4, 7, 11, 16];

interface SongData {
  id: number;
  title: string;
  artist: string;
  year: number;
  track_id: number;
  previewLink: string;
}

export default function PlayPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [songData, setSongData] = useState<SongData | null>(null);


  function getClientIdOrGenerate() {
    let clientId = localStorage.getItem('clientId');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('clientId', clientId);
    }
    return clientId;
  }

  async function getRandomSong() {
    setIsLoading(true);
    setError('');
    try {
      const clientId = getClientIdOrGenerate();
      const res = await fetch(`/api/song/random/${encodeURIComponent(clientId)}`);
      if (!res.ok) throw new Error('Failed to fetch song');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSongData(data.data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getRandomSong();
  }, []);


  if (error !== '') {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertCircleIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!songData) {
    return <div>Loading song...</div>;
  }

  return (

    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     {error && (
        <div className='fixed top-4 right-4 z-50'>
            <Alert variant="destructive" className="max-w-md">
                <AlertCircleIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     )}

      <h1 className='title'>Play page</h1>

    </div>
  );
}