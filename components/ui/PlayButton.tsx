import { useRouter } from "next/navigation"

export default function PlayButton(){

    const router = useRouter();

    function handleClick(){
        router.push('/play')
    }

    return(
        <button className="button" onClick={handleClick}>
            Play
        </button>
    )
}