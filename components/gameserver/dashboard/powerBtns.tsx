"use client"

import { useMediaQuery } from '@mui/material';
import React from 'react'
import KillBtn from './killBtn';
import { Button } from '@/components/ui/button';
import { Play, Power, RefreshCw, Square } from 'lucide-react';


interface PowerBtnsProps {
    loading: boolean;
    onStart: () => void;
    onRestart: () => void;
    onStop: () => void;
    onKill: () => void;
    state: string;
}

export function PowerBtns({ loading, onStart, onRestart, onStop, onKill, state }: PowerBtnsProps) {
    const isOnline = state ? state.toLowerCase() === "online" : false
    const isOffline = state? state.toLowerCase() === "offline" : true
    const isTransitioning = !isOnline && !isOffline

    return (
        <div className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onStart}
                disabled={loading || isOnline || isTransitioning}
                className="flex items-center gap-1"
            >
                <Play className="h-4 w-4" />
                Start
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                disabled={loading || isOffline}
                className="flex items-center gap-1"
            >
                <Square className="h-4 w-4" />
                Stop
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onRestart}
                disabled={loading || isOffline}
                className="flex items-center gap-1"
            >
                <RefreshCw className="h-4 w-4" />
                Restart
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={onKill}
                disabled={loading || isOffline}
                className="flex items-center gap-1"
            >
                <Power className="h-4 w-4" />
                Kill
            </Button>
        </div>
    )
}