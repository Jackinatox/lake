"use server"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import EmailAndCopyButton from './EmailAndCopyButton'
import ContactForm from './ContactForm'

export default async function HelpComponent({ t }: { t: any }) {
    return (
        <div className="w-full">
            <Card className="w-full max-w-6xl mx-auto mt-10">
                <CardHeader className='text-center'>
                    <CardTitle>{t('contactUsTitle')}</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className='mt-2'>
                    <div className="flex flex-col md:flex-row gap-4">
                        <EmailAndCopyButton />
                        <ContactForm t={t} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

