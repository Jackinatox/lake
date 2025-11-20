'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2 } from 'lucide-react';
import type { Game } from '@/models/config';

interface HeaderCardProps {
    currentGameName?: string | null;
    game: Game;
}

export default function HeaderCard({ currentGameName, game }: HeaderCardProps) {
    return (
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                    <Badge
                        variant="secondary"
                        className="w-fit uppercase tracking-widest text-[0.65rem]"
                    >
                        Game switch
                    </Badge>
                    <div className="space-y-1 text-left">
                        <CardTitle className="text-lg font-semibold leading-snug sm:text-xl">
                            Configure the new game experience
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Fine-tune the setup before you kick off the install.
                        </p>
                    </div>
                </div>
                <Gamepad2 className="h-10 w-10 text-primary/70" />
            </CardHeader>

            <CardContent className="space-y-5 text-sm text-muted-foreground">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-dashed border-border/60 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Current game
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <Image
                                src={`/images/light/games/icons/${currentGameName?.toLowerCase()}.webp`}
                                alt={`Current game ${currentGameName ?? ''}`}
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-md object-cover block dark:hidden"
                            />
                            <Image
                                src={`/images/dark/games/icons/${currentGameName?.toLowerCase()}.webp`}
                                alt={`Current game ${currentGameName ?? ''}`}
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-md object-cover hidden dark:block"
                            />
                            <p className="text-base font-semibold text-foreground">
                                {currentGameName
                                    ? currentGameName.charAt(0).toUpperCase() +
                                      currentGameName.slice(1)
                                    : 'Not set'}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/15 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            New selection
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <Image
                                src={`/images/light/games/icons/${game.name?.toLowerCase()}.webp`}
                                alt={`New game ${game.name}`}
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-md object-cover block dark:hidden"
                            />
                            <Image
                                src={`/images/dark/games/icons/${game.name?.toLowerCase()}.webp`}
                                alt={`New game ${game.name}`}
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-md object-cover hidden dark:block"
                            />
                            <p className="text-base font-semibold text-foreground">{game.name}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
