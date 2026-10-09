'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberConfigInputProps {
    id: string;
    value: number;
    /** Receives the parsed number, or NaN while the field is empty. */
    onChange: (value: number) => void;
    min: number;
    max: number;
    className?: string;
}

const toDraft = (value: number) => (Number.isFinite(value) ? String(value) : '');
const parseDraft = (draft: string) => (draft.trim() === '' ? NaN : Number(draft));

/**
 * Number field for game config settings that never fights the user's typing.
 *
 * The raw text is kept as a local draft, so the field can be cleared and
 * retyped freely. Out-of-range, empty or fractional values are only flagged
 * inline (red border + hint); they still reach the parent as-is (NaN when
 * empty) and are rejected on submit by `gameConfigSchema`.
 */
export function NumberConfigInput({
    id,
    value,
    onChange,
    min,
    max,
    className,
}: NumberConfigInputProps) {
    const t = useTranslations('buyGameServer.gameConfig.numberField');
    const [draft, setDraft] = useState(() => toDraft(value));
    const parsed = parseDraft(draft);

    // Pick up external changes (e.g. config restored when returning from checkout)
    if (toDraft(value) !== toDraft(parsed)) {
        setDraft(toDraft(value));
    }

    const error = Number.isNaN(parsed)
        ? t('required')
        : !Number.isInteger(parsed)
          ? t('wholeNumber')
          : parsed < min || parsed > max
            ? t('range', { min, max })
            : null;

    return (
        <div className="flex flex-col items-end gap-1">
            <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={draft}
                onChange={(e) => {
                    const next = e.target.value;
                    setDraft(next);
                    onChange(parseDraft(next));
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={cn(
                    'w-24 md:w-40',
                    // Hide the native spin buttons
                    '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className,
                )}
            />
            {error && (
                <p id={`${id}-error`} className="text-xs text-destructive text-right">
                    {error}
                </p>
            )}
        </div>
    );
}
