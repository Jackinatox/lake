import { createClient } from '@/utils/supabase/client';
import { Builder } from 'pterodactyl.js';
import React from 'react'


async function Game() {

    const supabase = createClient();
    const { data, error } = await supabase.from('GameOffers').select('*'); 

    try {



        return (
            <>
                
            </>
        )



    } catch (e) {
        return (
            <div>{JSON.stringify(e)}</div>
        )
    }  
}

export default Game
