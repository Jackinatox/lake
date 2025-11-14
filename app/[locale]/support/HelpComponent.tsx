'use server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import EmailAndCopyButton from './EmailAndCopyButton';
import ContactForm from './ContactForm';

export default async function HelpComponent({ t }: { t: any }) {
    return (
        <div className="w-full">
            <Card className="mx-auto mt-10 w-full max-w-6xl">
                <CardHeader className="space-y-2 text-center md:text-left">
                    <CardTitle>{t('contactUsTitle')}</CardTitle>
                    <CardDescription>{t('contactIntro')}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
                        <ContactForm />
                        <EmailAndCopyButton />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
