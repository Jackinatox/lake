import WingSettings, { CPU, WingSettingsFormValues } from '@/components/admin/wings/WingSettings';
import { createClient } from '@/utils/supabase/client';
import React from 'react'

async function page({ params }: { params: Promise<{ wing_id: string }> }) {
    const wing_id = (await params).wing_id;

    let cpus: CPU[] = [];

    const supabase = createClient();
    const { data, error } = await supabase.from('CPUs').select('*');


    if (!error) {
        cpus = data.map(cpu => ({
            id: cpu.id,
            Name: cpu.Name,
            Cores: cpu.Cores,
            Threads: cpu.Threads,
            SingleScore: cpu.SingleScore, // Fixing the naming issue
            MultiScore: cpu.MultiScore    // Fixing the naming issue
        }));
    } else {
        console.log('error: ', error);
    }

    const { data: wingData, error: wingError } = await supabase.from('Wings')
        .select(`
        id, 
        Name, 
        Location:Locations!inner (
            id, 
            Name, 
            CPU:CPUs!inner (
                id, 
                Name, 
                Cores, 
                Price
            ), 
            RAM
        )
    `)
        .eq('WingId', wing_id)
        .maybeSingle(); // Ensure only one result is returned


    // console.log(wingData, wingError);
    const location = wingData?.Location?.[0]; // Location is still an array
    const cpu = location?.CPU?.[0]; // CPU is also an array

    const processorId = cpu?.id; // Access safely

    const initialData: WingSettingsFormValues = wingData ? {
        id: wingData.id,
        name: wingData.Name,
        processorId: processorId
    } : {
        id: "",
        name: "",
        processorId: ""
    };

    console.log(initialData)


    return (
        <>
            <WingSettings processors={cpus} initialValues={initialData} />
        </>
    )
}

export default page