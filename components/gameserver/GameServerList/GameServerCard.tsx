import { Card, CardContent } from "@/components/ui/card";
import { Cpu, HardDrive, Calendar, MemoryStick } from "lucide-react";
import Image from "next/image";
import GameServerStatus from "./GameServerStatus";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ClientServer } from "@/models/prisma";
import Link from "next/link";


function formatExpirationDate(date: Date) {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: "Expired", color: "text-red-600 dark:text-red-400" };
    } else if (diffDays <= 7) {
        return { text: `${diffDays} days left`, color: "text-orange-600 dark:text-orange-400" };
    } else if (diffDays <= 30) {
        return { text: `${diffDays} days left`, color: "text-yellow-600 dark:text-yellow-400" };
    } else {
        return { text: date.toLocaleDateString(), color: "text-slate-600 dark:text-slate-400" };
    }
}

function ServerCard({ server, apiKey }: { server: ClientServer, apiKey: string }) {
    const expiration = formatExpirationDate(server.expires);

    return (
        <Link href={`/gameserver/${server.ptServerId}`}>
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-4 sm:p-6">
                {/* Mobile-first layout: stack vertically on small screens, horizontal on larger screens */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    {/* Main content section */}
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                        <div className="relative flex-shrink-0">
                            {/* Light mode icon - smaller on mobile */}
                            <span className="block dark:hidden">
                                <Image
                                    src={`/images/light/games/icons/${server.gameData.name.toLowerCase()}.webp`}
                                    alt={`${server.gameData.name} icon`}
                                    width={64}
                                    height={64}
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover"
                                    priority
                                />
                            </span>
                            {/* Dark mode icon - smaller on mobile */}
                            <span className="hidden dark:block">
                                <Image
                                    src={`/images/dark/games/icons/${server.gameData.name.toLowerCase()}.webp`}
                                    alt={`${server.gameData.name} icon (dark mode)`}
                                    width={64}
                                    height={64}
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover"
                                    priority
                                />
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            {/* Server name and status - responsive text size */}
                            <div className="mb-2 sm:mb-2">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-semibold text-lg sm:text-xl text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        {server.name}
                                    </h3>
                                    <GameServerStatus apiKey={apiKey} server={server.ptServerId} />
                                </div>
                            </div>
                            {/* Specifications - grid layout on mobile, flex on desktop */}
                            <div className="flex gap-6 text-sm pt-2">
                                <div className="flex items-center space-x-2">
                                    <Cpu className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-slate-600 dark:text-slate-300">{server.cpuPercent / 100} VCores</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <MemoryStick className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-slate-600 dark:text-slate-300">{server.ramMB / 1024} GB RAM</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <HardDrive className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="text-slate-600 dark:text-slate-300">{server.diskMB / 1024} GB Disk</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expiration section - full width on mobile, right-aligned on desktop */}
                    <div className="flex items-center justify-between sm:justify-end sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                        <div className="sm:text-right">
                            <div className="flex items-center space-x-2 mb-1">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-500 dark:text-slate-400">Expires</span>
                            </div>
                            <p className={`text-sm font-medium ${expiration.color}`}>{expiration.text}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        </Link>
    );
};

export default ServerCard;