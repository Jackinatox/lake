import WingSettings, { PXNode } from '@/components/admin/wings/WingSettings';
import { createClient } from '@/utils/supabase/client';
import React from 'react'

async function page({ params }: { params: Promise<{ wing_id: string }> }) {
    const wing_id = (await params).wing_id;

    const supabase = createClient();

    const { data: nodeData, error: nodeError } = await supabase.from('ProxmoxNodes').select('*');
    const { data: wingData, error: wingError } = await supabase.from('Wings').select('id, Name, Node').eq('PtWingId', wing_id).single();
    

    const mapedNodes: PXNode[] = nodeData.map((node) => ({
        id: node.id,
        CPUId: node.CPUId,
        RAMId: node.RAMId,
        Name: node.Name
    }));

    return (
        <WingSettings wingId={wing_id} nodes={mapedNodes} selectedNode={2}/>
    )
}

export default page