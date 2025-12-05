import { checkoutAction } from '@/app/actions/checkout/checkout';
import { notFound } from 'next/navigation';
import React from 'react';

async function page(params: PageProps<'/[locale]/products/packages/[packageId]/[gameId]'>) {
    const awaitedParams = await params.params;
    const packageId = awaitedParams.packageId;
    const gameId = awaitedParams.gameId;
    const id = Number.parseInt(packageId, 10);

    // await checkoutAction({type: 'PACKAGE', packageId: id, gameConfig: {}});
    if (Number.isNaN(id)) {
        notFound();
    }

    

    return <div></div>;
}

export default page;
