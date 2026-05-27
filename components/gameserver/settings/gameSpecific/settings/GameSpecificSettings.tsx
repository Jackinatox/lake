import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameServer } from '@/models/gameServerModel';
import { Gamepad2 } from 'lucide-react';
import MinecraftSettings from './MinecraftSettings';

interface GameSpecificSettingsProps {
    server: GameServer;
    apiKey: string;
}

function GameSpecificSettings({ server, apiKey }: GameSpecificSettingsProps) {
    let content: React.ReactNode = null;

    if (server.gameSlug === 'minecraft') {
        content = <MinecraftSettings server={server} apiKey={apiKey} />;
    }

    if (!content) return null;

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0 p-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Gamepad2 className="h-5 w-5" />
                    Game-Specific Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">{content}</CardContent>
        </Card>
    );
}

export default GameSpecificSettings;
