"use client";

import { checkoutAction, CheckoutParams } from "@/app/actions/checkout";
import { GameConfigComponent } from "@/components/booking2/game-config";
import { HardwareConfigComponent } from "@/components/booking2/hardware-config";
import CustomServerPaymentElements from "@/components/payments/PaymentElements";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchGames as fetchGame, fetchPerformanceGroups } from "@/lib/actions";
import { authClient } from "@/lib/auth-client";
import type {
    DiskOption,
    Game,
    GameConfig,
    HardwareConfig,
} from "@/models/config";
import { PerformanceGroup } from "@/models/prisma";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type ServerConfig = {
    hardwareConfig: HardwareConfig;
    gameSpecificConfig: GameConfig;
};

export default function GameServerConfig() {
    const { data: session } = authClient.useSession();
    const [clientSecret, setClientSecret] = useState("");
    const [step, setStep] = useState(1);
    const [performanceGroup, setPerformanceGroup] = useState<PerformanceGroup[]>(
        []
    );
    const [diskOptions, setDiskOptions] = useState<DiskOption[]>([]);
    const [selectedGame, setSelectedGame] = useState<Game>();
    const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const t = useTranslations("buyGameServer");

    const params = useParams();
    const router = useRouter();
    const gameId = Number.parseInt(params.gameId.toString(), 10);

    const hardwareConfigRef = useRef<any>(null);
    const gameConfigRef = useRef<any>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [performanceGroupData, games] = await Promise.all([
                    fetchPerformanceGroups(),
                    fetchGame(gameId),
                ]);

                if (!games) router.replace("/products/gameserver");

                setSelectedGame(games);
                setPerformanceGroup(performanceGroupData);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load configuration options",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast, gameId]);

    const handleHardwareConfigNext = (config: HardwareConfig) => {
        setHardwareConfig(config);
        setStep(2);
    };

    const handleGameConfigSubmit = async (gameSpecificConfig: GameConfig) => {
        if (!hardwareConfig) return;

        // Create the final server configuration
        // hardwareConfig,
        // gameConfig,
        const checkouParams: CheckoutParams = {
            type: "NEW",
            cpuPercent: hardwareConfig.cpuPercent,
            diskMB: hardwareConfig.diskMb,
            ramMB: hardwareConfig.ramMb,
            duration: hardwareConfig.durationsDays,
            ptServerId: null,
            creationServerConfig: {
                gameSpecificConfig: gameSpecificConfig,
                hardwareConfig: hardwareConfig,
            },
        };

        try {
            // console.log(checkouParams)
            setLoading(true);

            const clientSecret = (await checkoutAction(checkouParams)).client_secret;
            setClientSecret(clientSecret);

            setStep(3);

            // toast({
            //   title: "Success",
            //   description: `OrderID: ${newId}`,
            // })
        } catch (error) {
            console.error("Error submitting server configuration:", error);
            toast({
                title: "Error",
                description: error.toString(),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep = () => {
        if (step === 1 && hardwareConfigRef.current) {
            hardwareConfigRef.current.submit();
        } else if (step === 2 && gameConfigRef.current) {
            gameConfigRef.current.submit();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    </div>
                    <p className="mt-6 text-lg font-medium text-foreground">
                        {t("loading.configOptions")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background -mx-5 -mt-5">
            {/* Header with step indicator - STICKY TO TOP */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
                <div className="w-full px-4 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl sm:text-2xl font-bold">
                            {t("header.title")}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {t("header.step", { current: step, total: 3 })}
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-4 flex gap-2">
                        {[1, 2, 3].map((stepNumber) => (
                            <div
                                key={stepNumber}
                                className={`h-2 flex-1 rounded ${stepNumber === step
                                        ? "bg-primary"
                                        : stepNumber < step
                                            ? "bg-primary/60"
                                            : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main content with padding for sticky footer */}
            <div className="w-full px-4 py-6 pb-28 max-w-7xl mx-auto">
                {step === 1 && (
                    <div className="bg-card border rounded-lg p-2 md:p-6">
                        <HardwareConfigComponent
                            ref={hardwareConfigRef}
                            diskOptions={diskOptions}
                            performanceOptions={performanceGroup}
                            onNext={handleHardwareConfigNext}
                            initialConfig={hardwareConfig}
                        />
                    </div>
                )}

                {step === 2 && selectedGame && (
                    <div className="bg-card border rounded-lg p-2 md:p-6">
                        <GameConfigComponent
                            ref={gameConfigRef}
                            game={selectedGame}
                            onSubmit={handleGameConfigSubmit}
                        />
                    </div>
                )}

                {step === 3 && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card border rounded-lg p-2 md:p-6">
                            <h2 className="text-2xl font-bold mb-6">{t("payment.title")}</h2>
                            <CustomServerPaymentElements clientSecret={clientSecret} />
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky bottom navigation */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        {step > 1 && (
                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                className="w-full sm:w-auto"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t("nav.back")}
                            </Button>
                        )}
                        {step < 3 && (
                            <>
                                <>
                                    {!session?.user && (
                                        <div className="flex items-center gap-2 w-full sm:w-auto mb-2 sm:mb-0">
                                            <Info className="shrink-0" />
                                            <span className="text-sm">
                                                {t("auth.loginRequiredGameConfig")}
                                            </span>
                                        </div>
                                    )}
                                </>
                                <Button
                                    onClick={handleNextStep}
                                    className="w-full sm:w-auto sm:ml-auto"
                                    disabled={!session?.user}
                                >
                                    {t("nav.continue")}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {step === 3 && (
                            <div className="text-sm text-muted-foreground sm:ml-auto">
                                {t("payment.footerHint")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
