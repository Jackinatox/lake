'use client';

import type { MyFeedbackRow } from '@/app/actions/feedback/feedbackActions';
import { submitFeedbackAction } from '@/app/actions/feedback/feedbackActions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { feedbackDataSchema, type FeedbackData } from '@/lib/validation/feedback';
import { ChevronDown, Loader2, MessageSquare, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

const ISSUE_KEYS = [
    'install_failed',
    'wrong_java_version',
    'wont_start',
    'crashes',
    'wrong_mod_versions',
    'performance',
    'confusing_ui',
] as const;

const OUTCOME_KEYS = ['worked', 'partial', 'failed'] as const;
type Outcome = (typeof OUTCOME_KEYS)[number];

interface ModpackFeedbackCardProps {
    gameServerId: string;
    initialFeedback: MyFeedbackRow[];
    modpackId?: string;
    modpackVersion?: string;
    locale?: string;
}

function StarRow({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5 align-text-bottom">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={
                        i <= rating
                            ? 'h-3.5 w-3.5 fill-yellow-400 text-yellow-400'
                            : 'h-3.5 w-3.5 text-muted-foreground/40'
                    }
                />
            ))}
        </span>
    );
}

export default function ModpackFeedbackCard({
    gameServerId,
    initialFeedback,
    modpackId,
    modpackVersion,
    locale,
}: ModpackFeedbackCardProps) {
    const t = useTranslations('gameserver.feedback');
    const [open, setOpen] = useState(false);

    const [outcome, setOutcome] = useState<Outcome | undefined>(undefined);
    const [issues, setIssues] = useState<string[]>([]);
    const [rating, setRating] = useState<number | undefined>(undefined);
    const [message, setMessage] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [entries, setEntries] = useState<MyFeedbackRow[]>(initialFeedback);

    const hasAnyInput =
        outcome !== undefined || issues.length > 0 || rating !== undefined || message.trim() !== '';

    const toggleIssue = (issue: string, checked: boolean) => {
        setIssues((prev) => (checked ? [...prev, issue] : prev.filter((i) => i !== issue)));
    };

    const handleSubmit = () => {
        if (isPending || !hasAnyInput) return;
        setError('');
        setSuccess(false);

        const data: FeedbackData = {
            ...(outcome !== undefined && { outcome }),
            ...(issues.length > 0 && { issues }),
            ...(rating !== undefined && { rating }),
            ...(modpackId !== undefined && { modpackId }),
            ...(modpackVersion !== undefined && { modpackVersion }),
            ...(locale !== undefined && { locale }),
        };
        const trimmedMessage = message.trim();

        startTransition(async () => {
            try {
                const result = await submitFeedbackAction({
                    type: 'MODPACK_BETA',
                    gameServerId,
                    title: outcome,
                    message: trimmedMessage === '' ? undefined : trimmedMessage,
                    data,
                });
                setEntries((prev) => [
                    {
                        id: result.id,
                        type: 'MODPACK_BETA',
                        title: outcome ?? null,
                        message: trimmedMessage === '' ? null : trimmedMessage,
                        data,
                        createdAt: result.createdAt,
                    },
                    ...prev,
                ]);
                setOutcome(undefined);
                setIssues([]);
                setRating(undefined);
                setMessage('');
                setSuccess(true);
            } catch {
                setError(t('error'));
            }
        });
    };

    const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    return (
        <Card className="overflow-hidden">
            <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('title')}</span>
                    <span className="hidden flex-1 truncate text-xs text-muted-foreground sm:block">
                        {t('hint')}
                    </span>
                    <ChevronDown
                        className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="space-y-6 px-4 pb-4 pt-1">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{t('outcomeQuestion')}</p>
                            <RadioGroup
                                value={outcome ?? ''}
                                onValueChange={(value) => setOutcome(value as Outcome)}
                                className="gap-2"
                            >
                                {OUTCOME_KEYS.map((key) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <RadioGroupItem value={key} id={`mfc-outcome-${key}`} />
                                        <Label
                                            htmlFor={`mfc-outcome-${key}`}
                                            className="font-normal"
                                        >
                                            {t(`outcome.${key}`)}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">{t('issuesQuestion')}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {ISSUE_KEYS.map((key) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`mfc-issue-${key}`}
                                            checked={issues.includes(key)}
                                            onCheckedChange={(checked) =>
                                                toggleIssue(key, checked === true)
                                            }
                                        />
                                        <Label htmlFor={`mfc-issue-${key}`} className="font-normal">
                                            {t(`issues.${key}`)}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">{t('ratingLabel')}</p>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                            setRating(value === rating ? undefined : value)
                                        }
                                        aria-label={`${value}/5`}
                                        className="p-0.5"
                                    >
                                        <Star
                                            className={
                                                rating !== undefined && value <= rating
                                                    ? 'h-5 w-5 fill-yellow-400 text-yellow-400'
                                                    : 'h-5 w-5 text-muted-foreground/50'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('messagePlaceholder')}
                            maxLength={5000}
                            rows={3}
                        />

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending || !hasAnyInput}
                                size="sm"
                            >
                                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isPending ? t('submitting') : t('submit')}
                            </Button>
                            {success && (
                                <p className="text-sm text-muted-foreground">{t('success')}</p>
                            )}
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <p className="text-sm font-medium">{t('previousTitle')}</p>
                            {entries.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('previousEmpty')}
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {entries.map((entry) => {
                                        const parsed = feedbackDataSchema.safeParse(entry.data);
                                        const entryData = parsed.success ? parsed.data : undefined;
                                        return (
                                            <li
                                                key={entry.id}
                                                className="text-sm text-muted-foreground"
                                            >
                                                <span>{formatDate(entry.createdAt)}</span>
                                                {entryData?.outcome && (
                                                    <span>
                                                        {' – '}
                                                        {t(`outcome.${entryData.outcome}`)}
                                                    </span>
                                                )}
                                                {entryData?.rating !== undefined && (
                                                    <>
                                                        {' – '}
                                                        <StarRow rating={entryData.rating} />
                                                    </>
                                                )}
                                                {entry.message && (
                                                    <p className="mt-0.5 whitespace-pre-wrap break-words">
                                                        {entry.message}
                                                    </p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}