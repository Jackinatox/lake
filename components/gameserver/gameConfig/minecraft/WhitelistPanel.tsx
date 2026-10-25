'use client';

import { lookupMinecraftProfile } from '@/app/actions/gameservers/minecraftProfile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSendCommand, useServerStatus } from '@/hooks/useServerWebSocket';
import { propertiesFormat } from '@/lib/gameConfig/formats/properties';
import { AlertTriangle, FileQuestion, Loader2, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, type FormEvent } from 'react';
import type { GameConfigPanelProps } from '../types';
import { WHITELIST_KEY } from './constants';
import {
    parseWhitelist,
    serializeWhitelist,
    useMinecraftWhitelist,
    type WhitelistEntry,
} from './useMinecraftWhitelist';

// The server persists `whitelist on/off` to server.properties itself; give it a moment
// before re-reading the file.
const COMMAND_SETTLE_MS = 1500;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Whitelist manager for Minecraft. Player changes always go through `whitelist.json`
 * (+ `whitelist reload` when running). The on/off switch uses the console command while the
 * server runs, because the server rewrites server.properties from memory on `whitelist on/off`
 * and would otherwise clobber our edit. See docs/game-config-editors.md.
 */
export default function WhitelistPanel({ server, apiKey }: GameConfigPanelProps) {
    const t = useTranslations('gameserver.config.minecraft.whitelist');
    const { toast } = useToast();
    const serverStatus = useServerStatus();
    const { sendCommand } = useSendCommand();
    const {
        properties,
        whitelist,
        loaded,
        enabled,
        onlineMode,
        players,
        whitelistInvalid,
        lockedOut,
    } = useMinecraftWhitelist(server.identifier, apiKey, { revalidateOnMount: true });

    const [name, setName] = useState('');
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);
    const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isRunning = serverStatus === 'running';
    const isTransitioning = serverStatus === 'starting' || serverStatus === 'stopping';

    // Console input is queued while the server starts, so `starting` is fine here too.
    const reloadIfRunning = () => {
        if (isRunning || serverStatus === 'starting') sendCommand('whitelist reload');
    };

    const setWhitelistEnabled = async (on: boolean) => {
        setToggling(true);
        try {
            if (isRunning) {
                if (!sendCommand(`whitelist ${on ? 'on' : 'off'}`)) {
                    throw new Error('WebSocket not connected');
                }
                await wait(COMMAND_SETTLE_MS);
                await properties.reload();
            } else {
                await properties.update((current) =>
                    propertiesFormat.serialize(
                        propertiesFormat.set(
                            propertiesFormat.parse(current ?? ''),
                            WHITELIST_KEY,
                            on ? 'true' : 'false',
                        ),
                    ),
                );
            }
            toast({ title: on ? t('enabledToast') : t('disabledToast') });
        } catch (error) {
            console.error('Failed to toggle whitelist', error);
            toast({ title: t('toggleFailed'), variant: 'destructive' });
        } finally {
            setToggling(false);
        }
    };

    const updatePlayers = (transform: (entries: WhitelistEntry[]) => WhitelistEntry[]) =>
        whitelist.update((current) => serializeWhitelist(transform(parseWhitelist(current))));

    const handleAdd = async (event: FormEvent) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        setAddError(null);
        if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
            setAddError(t('errors.alreadyAdded', { name: trimmed }));
            return;
        }

        setAdding(true);
        try {
            const result = await lookupMinecraftProfile(trimmed, !onlineMode);
            if (result.status !== 'ok') {
                setAddError(t(`errors.${result.status}`, { name: trimmed }));
                return;
            }

            await updatePlayers((entries) =>
                entries.some((entry) => entry.uuid === result.uuid)
                    ? entries
                    : [...entries, { uuid: result.uuid, name: result.name }],
            );
            reloadIfRunning();
            setName('');
            toast({ title: t('addedToast', { name: result.name }) });
        } catch (error) {
            console.error('Failed to add player to whitelist', error);
            setAddError(t('errors.error', { name: trimmed }));
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (player: WhitelistEntry) => {
        setRemoving(player.uuid);
        try {
            await updatePlayers((entries) => entries.filter((entry) => entry.uuid !== player.uuid));
            reloadIfRunning();
            toast({ title: t('removedToast', { name: player.name }) });
        } catch (error) {
            console.error('Failed to remove player from whitelist', error);
            toast({ title: t('removeFailed'), variant: 'destructive' });
        } finally {
            setRemoving(null);
        }
    };

    const renderBody = () => {
        if (!loaded) {
            return (
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-9 w-full" />
                </div>
            );
        }

        if (properties.error || whitelist.error) {
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('loadFailed')}</AlertTitle>
                    <AlertDescription>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                                void Promise.all([properties.reload(), whitelist.reload()])
                            }
                        >
                            {t('retry')}
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        if (properties.notFound) {
            return (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <FileQuestion className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">{t('notGeneratedTitle')}</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        {t('notGeneratedDescription')}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {lockedOut && (
                    <Alert className="border-amber-500/50 bg-amber-500/5">
                        <AlertTriangle className="h-4 w-4 !text-amber-600" />
                        <AlertTitle>{t('attentionTitle')}</AlertTitle>
                        <AlertDescription className="space-y-2">
                            <p className="text-muted-foreground">{t('attentionDescription')}</p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button size="sm" onClick={() => inputRef.current?.focus()}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {t('attentionAddPlayers')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfirmDisableOpen(true)}
                                    disabled={toggling || isTransitioning}
                                >
                                    {t('attentionDisable')}
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                        <Label htmlFor="whitelist-enabled" className="text-sm font-medium">
                            {t('enabledLabel')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {enabled ? t('enabledDescription') : t('disabledDescription')}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {toggling && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                            id="whitelist-enabled"
                            checked={enabled}
                            disabled={toggling || isTransitioning}
                            onCheckedChange={(checked) => {
                                if (checked) void setWhitelistEnabled(true);
                                else setConfirmDisableOpen(true);
                            }}
                        />
                    </div>
                </div>

                {!enabled && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                        {t('disabledWarning')}
                    </p>
                )}

                <form onSubmit={handleAdd} className="space-y-1.5">
                    <Label htmlFor="whitelist-add" className="text-sm font-medium">
                        {t('addLabel')}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="whitelist-add"
                            ref={inputRef}
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                setAddError(null);
                            }}
                            placeholder={t('addPlaceholder')}
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={16}
                            className="h-9 min-w-0 flex-1"
                            disabled={adding || whitelistInvalid}
                        />
                        <Button
                            type="submit"
                            className="h-9 shrink-0"
                            disabled={adding || !name.trim() || whitelistInvalid}
                        >
                            {adding ? (
                                <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                            ) : (
                                <UserPlus className="h-4 w-4 sm:mr-2" />
                            )}
                            <span className="hidden sm:inline">{t('addButton')}</span>
                        </Button>
                    </div>
                    {addError && <p className="text-xs text-destructive">{addError}</p>}
                    {!onlineMode && (
                        <p className="text-xs text-muted-foreground">{t('offlineModeHint')}</p>
                    )}
                </form>

                {whitelistInvalid ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('invalidFileTitle')}</AlertTitle>
                        <AlertDescription>{t('invalidFileDescription')}</AlertDescription>
                    </Alert>
                ) : players.length === 0 ? (
                    <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
                        {t('empty')}
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('playersHeading', { count: players.length })}
                        </p>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {players.map((player) => (
                                <li
                                    key={player.uuid}
                                    className="flex min-w-0 items-center gap-2 rounded-md border px-2 py-1.5"
                                >
                                    <Avatar className="h-7 w-7 rounded-sm">
                                        <AvatarImage
                                            src={`https://mc-heads.net/avatar/${onlineMode ? player.uuid.replace(/-/g, '') : encodeURIComponent(player.name)}/28`}
                                            alt=""
                                        />
                                        <AvatarFallback className="rounded-sm text-xs">
                                            {player.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {player.name}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={() => void handleRemove(player)}
                                        disabled={removing !== null}
                                        aria-label={t('remove', { name: player.name })}
                                        title={t('remove', { name: player.name })}
                                    >
                                        {removing === player.uuid ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="p-3 pb-0 md:p-3 md:pb-0">
                <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    {t('title')}
                    {lockedOut && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t('description')}</p>
            </CardHeader>
            <CardContent className="p-3 pt-3">{renderBody()}</CardContent>

            <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('disableConfirm.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('disableConfirm.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('disableConfirm.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => void setWhitelistEnabled(false)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('disableConfirm.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
