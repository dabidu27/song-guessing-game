'use client'

import Image from "next/image";
import PlayButton from "../components/ui/PlayButton";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 px-4 py-8 text-center font-sans dark:bg-black">
      <h1 className="title text-[clamp(3rem,7vw,17rem)] leading-[0.82] tracking-[-0.06em]">
        <span className="title-line block">UnlimitedSong</span>
        <span className="title-line block">Guessle</span>
      </h1>
      <div className="mt-6">
        <PlayButton />
      </div>
    </div>
  );
}
