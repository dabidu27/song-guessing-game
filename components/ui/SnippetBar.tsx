'use client'
import { useEffect, useRef, useState } from "react"

interface SnippetBarProps{
    audioRef: React.RefObject<HTMLAudioElement | null>,
    durations: number[]
}

export default function SnippetBar({audioRef, durations}: SnippetBarProps){

    const [currentTime, setCurrentTime] = useState(0);
    const maxDuration = durations[durations.length - 1];

    useEffect(() => {

        const audio = audioRef.current;
        if(!audio)
            return;
        const handleTimeUppdate = () => setCurrentTime(audio.currentTime);
        audio.addEventListener('timeupdate', handleTimeUppdate);
        return () => audio.removeEventListener('timeupdate', handleTimeUppdate);

    }, [audioRef])

    const playheadPercentage = Math.min((currentTime / maxDuration) * 100, 100);

    return(
        <div className="w-full">
        
            <div className="relative">
                {/*playheadTriangle*/}
                <div
                    className="absolute -top-1 text-white transition-[left] duration-75 ease-linear"
                    style={{ left: `${playheadPercentage}%`, transform: 'translateX(-50%)' }}
                    >
                    ▼
                </div>

                {/*segmentedBar*/}
                <div className="flex w-full h-3 rounded-full overflow-hidden bg-neutral-800 mt-4">
                    {durations.map((duration, i) => {
                        const prevDuration = i === 0 ? 0 : durations[i-1];
                        const widthPercent = ((duration - prevDuration)/maxDuration) * 100;
                        return(
                            <div
                                key = {i}
                                className="h-full border-r border-black last:border-r-0"
                                style={{width: `${widthPercent}%`}}
                            />

                        )
                    })}
                </div>
            </div>
        </div>
    )

}