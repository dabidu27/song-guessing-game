
export default function GuessRow({
        label
}: {
        label: string
    }){

    let guessStatus = '';
    let finalLabel = ''
    if(label === 'Skipped'){
        guessStatus = 'Skipped';
        finalLabel = 'Skipped';
    }
    else{
        finalLabel = label.split('GuessStatus')[0];
        guessStatus = label.split('GuessStatus')[1];
    }

    let color = '';
    if (guessStatus === 'Correct')
        color = 'green';
    else if (guessStatus === 'Wrong')
        color = 'red';
    else if (guessStatus === 'CorrectArtist')
        color = '#81821a';
    else
        color = 'grey';

    return(


        <div className="guessRow" style={{backgroundColor:color}}>
            {finalLabel}
        </div>
    )
}