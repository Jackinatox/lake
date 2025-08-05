"use server"

import React from 'react'
import HelpComponent from './HelpComponent'
import { getTranslations } from 'next-intl/server';

async function page() {
    const t = await getTranslations("getHelp");
    return (
        <div className='flex flex-col items-center'>
            <h1 className="text-3xl md:text-5xl lg:text-6xl text-center font-bold tracking-tight">
                {t('title1')}
                <span className="text-primary">{t('title2')}</span>
                {t('title3')}
            </h1>
            <HelpComponent t={t} />
        </div>
    )
}

export default page