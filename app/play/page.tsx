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
import SnippetBar from '@/components/ui/SnippetBar';

const SNIPPET_DURATIONS = [1, 2, 4, 7, 11, 30];

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
  const [songPlaying, setSongPlaying] = useState<Boolean>(false);
  const [status, setStatus] = useState('playing');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldResetRef = useRef(true);

  function handleSkip(){

    setAttempts((prev) => {
      const next = [...prev];
      const emptyIndex = next.findIndex((a) => a === '');
      if(emptyIndex !== -1)
        next[emptyIndex] = 'Skipped';

      const attemptsUsed = next.filter((a) => a !== '').length;
      if(attemptsUsed === SNIPPET_DURATIONS.length)
        setStatus('lost');

      shouldResetRef.current = true;
      
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
    setAttempts(Array(SNIPPET_DURATIONS.length).fill(''));
    setStatus('playing');
    shouldResetRef.current = true;
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

  //each playSnippet call adds a new stopAt listener - the listener is removed only after stopAt fires
  //if the user pauses manually, stopAt does not fire and the listener is never removed
  //the next playSnippet call will add a new stopAt listener, on top of the old one
  //both listners watch the same audioRef, so stopping at undesired times may happen
  //we fix by explicitly deleting old listeners whenever playSnippet is pressed again

  const stopAtRef = useRef<(() => void) | null>(null);

  function playSnippet(){

    const audio = audioRef.current;
    if(!audio)
      return;

    if(stopAtRef.current){
      audio.removeEventListener('timeupdate', stopAtRef.current);
    }
    const currAttempt = attempts.filter(a => a !== '').length //attempts used so far

    const duration = SNIPPET_DURATIONS[Math.min(currAttempt, SNIPPET_DURATIONS.length - 1)]; //avoid overflow

    if(shouldResetRef.current)
    {
      audio.currentTime = 0; //start at the beginning of the audio
      shouldResetRef.current = false;
    }

    audio.play();
    setSongPlaying(true);

    const stopAt = () => {
      if(audio.currentTime >= duration){
        audio.pause();
        setSongPlaying(false);
        audio.removeEventListener('timeupdate', stopAt);
        stopAtRef.current = null;
        shouldResetRef.current = true;
      }
    }

    stopAtRef.current = stopAt;
    audio.addEventListener('timeupdate', stopAt);
  }

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

      <audio ref={audioRef} src={songData.previewLink}/>

     {error && (
        <div className='fixed top-4 right-4 z-50'>
            <Alert variant="destructive" className="max-w-md">
                <AlertCircleIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     )}

     {status === 'lost' && (
        <div className='fixed top-4 right-4 z-50'>
            <Alert variant="destructive" className="max-w-md">
                <AlertCircleIcon />
                <AlertTitle>You lost</AlertTitle>
                <AlertDescription>Song was {songData.artist}-{songData.title}</AlertDescription>
                 <button onClick={() => {
                  setSongData(null);
                  getRandomSong();
                }}>Play again</button>
            </Alert>
  
        </div>
     )}

      <h1 className='title'>Play page</h1>

      <div className="flex flex-col gap-2 mt-4 w-full max-w-md">
        {Array.from({length: SNIPPET_DURATIONS.length}).map((_, i) => {
          return(<GuessRow key = {i} label={attempts[i]}>
          </GuessRow>)
        })}

        <button className="button" onClick={() => {
          if(!songPlaying)
            playSnippet();
          else
            {
              audioRef.current?.pause();
              setSongPlaying(false);
            }
        }}>
          {!songPlaying? `Play snippet (${SNIPPET_DURATIONS[Math.min(attempts.filter(a => a !== "").length, SNIPPET_DURATIONS.length - 1)]}s)`
              :'Pause snippet'}
        </button>
        <SnippetBar audioRef={audioRef} durations={SNIPPET_DURATIONS}></SnippetBar>
      </div>
    
      
      <div className="flex flex-1 items-center gap-2">
        <input className="input"></input>
        <button className = "button" onClick={handleSkip}>Skip</button>
      </div>
      

    </div>
  );
}