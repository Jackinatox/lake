'use client';

import webSocket from '@/lib/Pterodactyl/webSocket';
import { GameServer } from '@/models/gameServerModel';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import EulaDialog from '../EulaDialog';
import FileManager from '../FileManager/FileManager';
import { writeFile } from '../FileManager/pteroFileApi';
import { TabsComponent } from '../GameserverTabs';
import GameServerSettings from '../settings/GameServerSettings';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import BackupManager from '../BackupManager/BackupManager';
import { ServerHeader } from './ServerHeader';
import { ConsolePanel } from './ConsolePanel';

interface serverProps {
    server: GameServer;
    ptApiKey: string;
}

function GameDashboard({ server, ptApiKey }: serverProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [eulaOpen, setEulaOpen] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const wsCreds = useRef<any>(null);
    const searchParams = useSearchParams();
    const autoStart = useRef(searchParams.get('start') === 'true');
    const router = useRouter();
    const t = useTranslations();
    const pathname = usePathname();

    const [serverStats, setServerStats] = useState<any>();

    const handleWsMessage = async (msg: string) => {
        const data = JSON.parse(msg);

        switch (data.event) {
            case 'stats': {
                const stats = JSON.parse(data.args[0]);

                const smallToZero = (n: number) => (n < 1 ? 0 : n);

                const cpu = Number.parseFloat(
                    Math.min((stats.cpu_absolute / server.limits.cpu) * 100, 100).toFixed(1)
                );
                const disk = Number.parseFloat((stats.disk_bytes / 1024 / 1024 / 1024).toFixed(2));
                const memory = Number.parseFloat(
                    (stats.memory_bytes / 1024 / 1024 / 1024).toFixed(2)
                );
                const memoryLimit = Number.parseFloat(
                    (stats.memory_limit_bytes / 1024 / 1024 / 1024).toFixed(2)
                );
                const uptime = Number.parseFloat((stats.uptime / 1000).toFixed(2));

                const roundedStats = {
                    cpu_absolute: smallToZero(cpu),
                    disk_bytes: smallToZero(disk),
                    memory_bytes: memory,
                    memory_limit_bytes: smallToZero(memoryLimit),
                    network: {
                        rx_bytes: stats.network.rx_bytes,
                        tx_bytes: stats.network.tx_bytes,
                    },
                    state: stats.state,
                    uptime: smallToZero(uptime),
                };
                setServerStats(roundedStats);
                break;
            }

            case 'console output': {
                const consoleLine = data.args[0];
                if (
                    consoleLine.includes(
                        'You need to agree to the EULA in order to run the server.'
                    )
                ) {
                    setEulaOpen(true);
                }
                setLogs((prevLogs) => {
                    if (prevLogs[prevLogs.length - 1] === consoleLine) {
                        return prevLogs; // Avoid duplicate log
                    }
                    return [...prevLogs, consoleLine];
                });
                break;
            }

            case 'token expiring': {
                console.log('Token expiring... fetching new token.');

                const wsCred = await webSocket(server.identifier, ptApiKey);
                wsCreds.current = wsCred;

                wsRef.current?.send(JSON.stringify({ event: 'auth', args: [wsCred?.data.token] }));
                console.log('Re-authenticated WebSocket.');

                break;
            }

            case 'auth success': {
                if (loading) {
                    wsRef.current?.send(
                        JSON.stringify({
                            event: 'send logs',
                        })
                    );
                }

                setLoading(false);

                if (autoStart.current) {
                    // Send start command directly (we know WebSocket is ready)
                    wsRef.current?.send(
                        JSON.stringify({
                            event: 'set state',
                            args: ['start'],
                        })
                    );
                    autoStart.current = false;
                    router.replace(pathname, { scroll: false });
                } else {
                    console.log('auto start is false');
                }
            }
        }
    };

    useEffect(() => {
        const startWebSocket = async () => {
            if (!wsRef.current) {
                const wsCred = await webSocket(server.identifier, ptApiKey);
                wsCreds.current = wsCred;

                const ws: WebSocket = new WebSocket(wsCred?.data.socket);
                wsRef.current = ws;

                ws.onopen = () => {
                    ws.send(
                        JSON.stringify({
                            event: 'auth',
                            args: [wsCred?.data.token],
                        })
                    );
                };

                ws.onmessage = (ev: MessageEvent) => {
                    handleWsMessage(ev.data);
                };
            }
        };

        startWebSocket();

        return () => {
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, []);

    const handleAcceptEula = async () => {
        if (!loading && wsRef.current) {
            await writeFile(server.identifier, 'eula.txt', 'eula=true', ptApiKey);
            killAndRestart();
        }
    };

    const handleStart = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['start'],
                })
            );
        }
    };

    const handleRestart = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['restart'],
                })
            );
        }
    };

    const handleStop = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['stop'],
                })
            );
        }
    };

    const handleKill = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['kill'],
                })
            );
        }
    };

    const killAndRestart = () => {
        if (!loading && wsRef.current) {
            handleKill();
            setTimeout(() => {
                handleStart();
            }, 500);
            return;
        }
    };

    const handleCommand = (command: string) => {
        console.log(command);
        wsRef.current?.send(
            JSON.stringify({
                event: 'send command',
                args: [command],
            })
        );
    };

    return (
        <>
            <EulaDialog isOpen={eulaOpen} onAcceptEula={handleAcceptEula} setOpen={setEulaOpen} />
            <div className="w-full max-w-full overflow-hidden">
                {/* Header with server info and controls */}
                <ServerHeader
                    server={server}
                    ptApiKey={ptApiKey}
                    serverStats={serverStats}
                    loading={loading}
                    onStart={handleStart}
                    onStop={handleStop}
                    onRestart={handleRestart}
                    onKill={handleKill}
                />

                {/* Tabs with Console, Files, Backups, Settings */}
                <TabsComponent
                    consoleComponent={
                        <ConsolePanel
                            server={server}
                            serverStats={serverStats}
                            logs={logs}
                            handleCommand={handleCommand}
                        />
                    }
                    fileManagerComponent={<FileManager server={server} apiKey={ptApiKey} />}
                    backupManagerComponent={<BackupManager server={server} apiKey={ptApiKey} />}
                    settingsComponent={<GameServerSettings server={server} apiKey={ptApiKey} />}
                />
            </div>
        </>
    );
}

export default GameDashboard;
