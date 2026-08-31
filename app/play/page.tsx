'use client'

import { useEffect, useRef, useState } from 'react';
import { AlertCircleIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import { Progress, ProgressLabel } from '@/components/ui/progress';

import GuessRow from '@/components/ui/GuessRow';
import { Input } from '@base-ui/react';

const SNIPPET_DURATIONS = [1, 2, 4, 7, 11, 16];

const attempts = Array.from({length: SNIPPET_DURATIONS.length}).map((_, i) => {
  return '';
})

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
  const [attempts, setAttempts] = useState<string[]>(Array(SNIPPET_DURATIONS.length).fill(''));

  function handleSkip(){
    setAttempts((prev) => {
      const next = [...prev];
      const emptyIndex = next.findIndex((a) => a === '');
      if(emptyIndex !== -1)
        next[emptyIndex] = 'Skipped';
      return next;
    })
  }

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

  if(!songData){
  return(
    <div className="flex flex-col flex-1 items-center justify-center bg-background text-foreground font-sans">
      <Progress className = "w-full max-w-sm" value = {null}>
        <ProgressLabel>Loading song...</ProgressLabel>
      </Progress>
    </div>
    )
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

      <div className="flex flex-col gap-2 mt-4 w-full max-w-md">
        {Array.from({length: SNIPPET_DURATIONS.length}).map((_, i) => {
          return(<GuessRow key = {i} label={attempts[i]}>
          </GuessRow>)
        })}
      </div>
      
      <div className="flex flex-1 items-center gap-2">
        <Input className="input"></Input>
        <button className = "button" onClick={handleSkip}>Skip</button>
      </div>
      

    </div>
  );
}