"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Game, GameConfig } from "@/models/config"
import { GameConfigComponent } from "@/components/booking2/game-config"
import { Loader2 } from "lucide-react"
import { submitGameChangeRequest } from "./actions"

interface ChangeGameConfigClientProps {
    serverId: string
    game: Game
    currentGameName?: string | null
}

export default function ChangeGameConfigClient({
    serverId,
    game,
    currentGameName,
}: ChangeGameConfigClientProps) {
    const { toast } = useToast()
    const gameConfigRef = useRef<{ submit: () => void } | null>(null)
    const [submittedConfig, setSubmittedConfig] = useState<GameConfig | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (config: GameConfig) => {
        try {
            setIsSubmitting(true)
            await submitGameChangeRequest({
                serverId,
                gameId: game.id,
                gameConfig: config,
            })
            setSubmittedConfig(config)
            toast({
                title: "Configuration captured",
                description: "Your desired game setup has been recorded.",
            })
        } catch (error) {
            console.error("Failed to record game change request", error)
            toast({
                title: "Unable to save",
                description: "We could not record the configuration. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                        Configure the new game experience
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {currentGameName && (
                        <p>
                            Current game: <span className="font-semibold text-foreground">{currentGameName}</span>
                        </p>
                    )}
                    <p>
                        You're switching to <span className="font-semibold text-foreground">{game.name}</span>. Adjust the
                        options below, then hit <span className="font-semibold text-foreground">Save configuration</span> to change the Game on your server
                    </p>
                </CardContent>
            </Card>

            <GameConfigComponent
                ref={gameConfigRef}
                game={game}
                onSubmit={handleSubmit}
            />

            <div className="flex justify-end">
                <Button
                    onClick={() => gameConfigRef.current?.submit()}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save configuration
                </Button>
            </div>

            {submittedConfig && (
                <Submitted submittedConfig={submittedConfig} />
            )}
        </div>
    )
}

interface SubmittedProps {
    submittedConfig: GameConfig
}

function Submitted({ submittedConfig }: SubmittedProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Saved configuration summary</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">
                    {JSON.stringify(submittedConfig, null, 2)}
                </pre>
            </CardContent>
        </Card>
    )
}

