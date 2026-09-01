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

interface QueryResult{
  id: number,
  title: string,
  artist: string
}

export default function PlayPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [songData, setSongData] = useState<SongData | null>(null);
  const [attempts, setAttempts] = useState<string[]>(Array(SNIPPET_DURATIONS.length).fill(''));
  const [songPlaying, setSongPlaying] = useState<Boolean>(false);
  const [status, setStatus] = useState('playing');
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldResetRef = useRef(true);

  function handleSkip(){

    setSongPlaying(false);
    shouldResetRef.current = true;
    audioRef.current?.pause();

    setAttempts((prev) => {
      const next = [...prev];
      const emptyIndex = next.findIndex((a) => a === '');
      if(emptyIndex !== -1)
        next[emptyIndex] = 'Skipped';

      const attemptsUsed = next.filter((a) => a !== '').length;
      if(attemptsUsed === SNIPPET_DURATIONS.length)
        setStatus('lost');

      return next;
    })

    setQuery('');
    setQueryResults([]);
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
    setSongPlaying(false);
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

  //start playing the song anytime a new attempt is made (when attempts changes)
  useEffect(() => {
    const attemptsUsed = attempts.filter(a => a !== '').length;
    if(attemptsUsed > 0 && status === 'playing')
      playSnippet();
  }, [attempts])

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

  const debounceRef = useRef<ReturnType <typeof setTimeout> | null>(null);

  //Every keystroke will call this function
  //setTimeout(fetch function, 250) delays the api fetch by 250ms
  //every new keystorke delets the old delay and sets a new one
  //only when there will be no keystroke for 250ms, a fetch will run
  const handleQuery = (value: string) => {

    setQuery(value);
    if(debounceRef.current)
      clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async() => {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setQueryResults(data.results ?? []);
    }, 250);
  }

  const handleSubmission = ((song: QueryResult) => {
    if (status !== 'playing') {
      return;
    }

    const correctGuess = song.id === songData?.id;

    setSongPlaying(false);
    shouldResetRef.current = true;
    audioRef.current?.pause();

    setAttempts((prev) => {

      const next = [...prev];
      const empty = next.findIndex(a => a === '');

      if(empty !== -1)
        if(correctGuess)
          next[empty] = `${song.title} - ${song.artist}GuessStatusCorrect`
        else
          next[empty] = `${song.title} - ${song.artist}GuessStatusWrong`

      const attemptsUsed = next.filter(a => a !== '').length;

      if(correctGuess)
        setStatus('won');
      else if (attemptsUsed === SNIPPET_DURATIONS.length)
        setStatus('lost');

      return next;
    })

    //reset guess
    setQuery('');
    setQueryResults([]);

  })

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
            </Alert>
  
        </div>
     )}

     {status === 'won' && (
       <div className='fixed top-4 right-4 z-50'>
            <Alert variant="default" className="max-w-md">
                <AlertCircleIcon />
                <AlertTitle>You won</AlertTitle>
                <AlertDescription>Song was {songData.artist}-{songData.title}</AlertDescription>
            </Alert>
  
        </div>
     )}

      <h1 className='title'>UnlimitedSongGuessle</h1>

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
        <div className='relative flex-1'>

          <input className="input"
            value={query}
            onChange={(e) => handleQuery(e.target.value)} //take the text written - e.target.value - and pass it to handleQuery at every keystore
            placeholder='Guess the song'
          ></input>

          {/*suggestion dropdown*/}
          {queryResults.length > 0 && (
            <ul className="absolute top-full left-0 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden z-10">
            {queryResults.map((song: QueryResult) => (
              <li
                key={song.id}
                onClick={() => handleSubmission(song)}
                className="px-4 py-2 cursor-pointer hover:bg-neutral-800 text-white"
              >
                {song.title} — {song.artist}
              </li>
            ))}
          </ul>
          )}


        </div>
        <button className = "button" onClick={() => {
          if(status !== 'lost' && status !== 'won')
            handleSkip();
          else
              {
                setSongData(null);
                getRandomSong();
                setQuery('');
                setQueryResults([]);
              }
          }}>
          {status === 'lost' || status === 'won' ? 'Play again' : 'Skip'}
          </button>
      </div>
      

    </div>
  );
}