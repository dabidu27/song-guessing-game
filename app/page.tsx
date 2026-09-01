'use client'

import Image from "next/image";
import PlayButton from "../components/ui/PlayButton";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 px-4 py-8 text-center font-sans dark:bg-black">
      <h1 className="title text-4xl sm:text-5xl md:text-6xl">UnlimitedSongGuessle</h1>
      <div className="mt-6">
        <PlayButton />
      </div>
    </div>
  );
}
