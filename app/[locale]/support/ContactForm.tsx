'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ContactForm() {
    const session = authClient.useSession();
    const { toast } = useToast();
    const t = useTranslations('getHelp');
    const categories = ['GENERAL', 'TECHNICAL', 'BILLING', 'ACCOUNT'] as const;
    const categoryKeyMap = {
        GENERAL: 'categories.general',
        TECHNICAL: 'categories.technical',
        BILLING: 'categories.billing',
        ACCOUNT: 'categories.account',
    } as const;
    const searchParams = useSearchParams();
    const categoryPreSelect = searchParams.get('category');
    const defaultCategory = categories.find((cat) => cat === categoryPreSelect) || 'GENERAL'; // Lets me preset the selected cat by providing it as a search param, used to link for a refund
    const [category, setCategory] = useState<(typeof categories)[number]>(defaultCategory);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const maxMessageLength = 2000;
    const trimmedMessage = message.trim();
    const messageTooLong = trimmedMessage.length > maxMessageLength;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!trimmedMessage) {
            toast({ title: t('messageRequired'), variant: 'destructive' });
            return;
        }
        if (messageTooLong) {
            toast({ title: t('messageTooLong'), variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: trimmedMessage,
                    subject: subject.trim(),
                    category,
                }),
            });

            if (response.status === 401) {
                toast({
                    title: t('loginRequiredTitle'),
                    description: t('loginRequiredDescription'),
                    variant: 'destructive',
                });
                return;
            }

            if (!response.ok) {
                toast({
                    title: t('ticketCreationFailed'),
                    description: t('ticketCreationFailedDescription'),
                    variant: 'destructive',
                });
                return;
            }

            const data = await response.json();
            toast({
                title: t('ticketCreated', { id: data.ticket.ticketId }),
                description: t('ticketCreatedDescription'),
            });
            setMessage('');
            setSubject('');
            setCategory(defaultCategory);
        } catch (error) {
            toast({
                title: t('ticketCreationFailed'),
                description: t('ticketCreationFailedDescription'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full flex-1">
            <CardHeader>
                <CardTitle>{t('writeDirectly')}</CardTitle>
                <CardDescription>{t('answerToEmail')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="category">{t('categoryLabel')}</Label>
                        <Select
                            value={category}
                            onValueChange={(value) =>
                                setCategory(value as (typeof categories)[number])
                            }
                        >
                            <SelectTrigger id="category" className="h-10">
                                <SelectValue placeholder={t('categoryPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {t(categoryKeyMap[value])}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t('categoryHelper')}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">{t('subjectLabel')}</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            maxLength={120}
                            placeholder={t('subjectPlaceholder')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">{t('messageLabel')}</Label>
                        <Textarea
                            id="message"
                            placeholder={t('describeProblemPlaceholder')}
                            rows={6}
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            maxLength={maxMessageLength}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('messageHelper')}</span>
                            <span className={messageTooLong ? 'text-destructive' : ''}>
                                {t('messageLength', {
                                    current: trimmedMessage.length,
                                    max: maxMessageLength,
                                })}
                            </span>
                        </div>
                    </div>

                    <CardFooter className="flex flex-col items-end gap-2 p-0 md:p-0">
                        <div className="flex flex-row justify-between w-full items-center gap-4">
                            {!(session.isPending || session.data?.user) && (
                                <p className="text-foreground">
                                    {t.rich('loginRequiredTitle', {
                                strong: (chunks) => (
                                    <Link href="/login" className="underline underline-offset-4">
                                        <strong>{chunks}</strong>
                                    </Link>
                                ),
                            })}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={
                                    !session.data?.user ||
                                    isSubmitting ||
                                    !trimmedMessage ||
                                    messageTooLong
                                }
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t('submitting')}
                                    </span>
                                ) : (
                                    t('submit')
                                )}
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    );
}
