"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl';

export default function EmailAndCopyButton() {
    const t = useTranslations("getHelp");
    return (
        <Card className="flex-1 rounded-md">
            <CardHeader>
                <CardTitle>
                    {t('writeEmail')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <CopyButton />
            </CardContent>
        </Card>
    )
}
function CopyButton() {
    const t = useTranslations("getHelp");

    return (
        <div className="text-base leading-relaxed">
            {t('writeEmailTo')}{' '}
            <span className="inline-flex items-center">
                <a
                    href="mailto:support@scyed.com"
                    className="text-blue-600 underline inline-flex items-center"
                >
                    support@scyed.com
                </a>
                <button
                    type="button"
                    className="ml-1 p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ border: 'none', background: 'transparent', paddingTop: 2 }}
                    onClick={() => navigator.clipboard.writeText('support@scyed.com')}
                >
                    <Copy size={16} />
                </button>
            </span>
            {' '} {t('weWillAnswer')}
        </div>
    );

}