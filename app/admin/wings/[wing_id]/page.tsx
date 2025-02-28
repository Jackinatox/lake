import WingSettings, { CPU } from '@/components/admin/wings/WingSettings';
import { createClient } from '@/utils/supabase/client';
import React from 'react'

async function page({ params }: { params: Promise<{ wing_id: string }> }) {
    const wing_id = (await params).wing_id;

    let cpus: CPU[] = [];
    
    const supabase = createClient();
    const { data, error }  = await supabase.from('cpus').select('*');


    if (!error){
        cpus = data.map(cpu => ({
            id: cpu.id,
            Name: cpu.name,
            Cores: cpu.cores,
            Threads: cpu.threads,
            SingleScore: cpu.singlescore, // Fixing the naming issue
            MultiScore: cpu.multiscore    // Fixing the naming issue
        }));
    }


    return (
        <>
            <WingSettings processors={cpus}/>
        </>
    )
}

export default page