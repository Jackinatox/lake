import { getUserServer } from "@/app/data-access-layer/clientServers/getUsersServer"
import { auth } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cpu, HardDrive, Calendar, Settings, MemoryStick } from "lucide-react"
import Link from "next/link"
import { ClientServer } from 'pterodactyl.js'



const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL
const apiKey = process.env.PTERODACTYL_API_KEY;

if (!baseUrl || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
}


function getStatusColor(status: string) {
    switch (status) {
        case "online":
            return "bg-green-500"
        case "offline":
            return "bg-red-500"
        case "maintenance":
            return "bg-yellow-500"
        default:
            return "bg-gray-500"
    }
}

function getStatusBadgeVariant(status: string) {
    switch (status) {
        case "online":
            return "default"
        case "offline":
            return "destructive"
        case "maintenance":
            return "secondary"
        default:
            return "outline"
    }
}


function formatExpirationDate(date: Date) {
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return { text: "Expired", color: "text-red-600 dark:text-red-400" }
    } else if (diffDays <= 7) {
        return { text: `${diffDays} days left`, color: "text-orange-600 dark:text-orange-400" }
    } else if (diffDays <= 30) {
        return { text: `${diffDays} days left`, color: "text-yellow-600 dark:text-yellow-400" }
    } else {
        return { text: date.toLocaleDateString(), color: "text-slate-600 dark:text-slate-400" }
    }
}

interface serverProps {
    servers: any
}

export default async function GameServersPage() {
    const session = await auth();

    const ptApiKey = session?.user.ptKey;

    const clientServers = await getUserServer();


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Game Servers</h1>
                    <p className="text-slate-600 dark:text-slate-400">All Deine Server</p>
                </div>

                <div className="space-y-4">
                    {clientServers.map((server) => {
                        const expiration = formatExpirationDate(server.expires)

                        return (
                            <Card key={server.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        {/* Left side - Server info */}
                                        <div className="flex items-center space-x-4">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={"/images/games/icons/" + server.gameData.name.toLocaleLowerCase() + ".webp" || "/placeholder.svg"} // TODO: Add ServerIcon
                                                    alt={`${server.gameData.name} icon`}   // TODO: Add ServerIcon
                                                    className="w-16 h-16 rounded-xl object-cover"
                                                />

                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-semibold text-xl text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {server.gameData.name}
                                                    </h3>
                                                    {/* <Badge variant={getStatusBadgeVariant("online")} className="capitalize">
                                                        {"Online"}  {//TODO: Status. but not in the pt api
                                                        }
                                                    </Badge> */}
                                                </div>
                                                {/* <p className="text-slate-500 dark:text-slate-400 mb-3">{server.id}</p> */}
                                                <p> </p>

                                                {/* Specs row */}
                                                <div className="flex items-center space-x-6 text-sm pt-4">

                                                    <div className="flex items-center space-x-2">
                                                        <Cpu className="w-4 h-4 text-blue-500" />
                                                        <span className="text-slate-600 dark:text-slate-300">{server.cpuPercent / 100} VCores</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <MemoryStick className="w-4 h-4 text-purple-500" />
                                                        <span className="text-slate-600 dark:text-slate-300">{server.ramMB / 1024} GB</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <HardDrive className="w-4 h-4 text-green-500" />
                                                        <span className="text-slate-600 dark:text-slate-300">{server.diskMB / 1024} GB</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right side - Expiration and actions */}
                                        <div className="flex items-center space-x-6 flex-shrink-0">
                                            <div className="text-right">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">Expires</span>
                                                </div>
                                                <p className={`text-sm font-medium ${expiration.color}`}>{expiration.text}</p>
                                            </div>

                                            <Button asChild
                                                className="group-hover:bg-blue-600 group-hover:text-white transition-colors bg-transparent"
                                                variant="outline"
                                            // disabled={server.attributes.is_transferring || server.attributes.is_suspended}
                                            >
                                                <Link href={`gameserver/${server.serverId}`}>
                                                <Settings className="w-4 h-4 mr-2" />
                                                Control Panel
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            </Card>
                )
                    })}
            </div>

            {clientServers.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Settings className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No servers found</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Get started by creating your first game server</p>
                </div>
            )}

            <div className="mt-8 text-center">
                <Button
                    size="lg"
                    variant="outline"
                >
                    Add New Server
                </Button>
            </div>
        </div>
        </div >
    )
}
