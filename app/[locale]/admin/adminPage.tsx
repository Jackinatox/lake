"use client";

import Link from 'next/link';
import { CalendarClock, Cog, Gamepad2Icon, MonitorX, SquarePlay, UsersIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

type AdminTile = {
    name: string;
    link: string;
    Icon: typeof UsersIcon;
    color: string;
};

const tiles: AdminTile[] = [
    { name: 'Users', link: '/admin/users', Icon: UsersIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'Gameservers', link: '/admin/gameservers', Icon: Gamepad2Icon, color: 'from-green-500 to-emerald-600' },
    { name: 'Wings', link: '/admin/wings', Icon: SquarePlay, color: 'from-purple-500 to-indigo-600' },
    { name: 'Stripe Sessions', link: '/admin/sessions', Icon: CalendarClock, color: 'from-yellow-500 to-amber-500' },
    { name: 'Provision By Id', link: '/admin/TestInternalFunctions/provisionById', Icon: Cog, color: 'from-orange-500 to-amber-600' },
    { name: 'Job Status', link: '/admin/jobStatus', Icon: MonitorX, color: 'from-red-500 to-rose-600' },
];

const AdminPage = () => {
    return (
        <div className="w-full py-8 sm:mx-auto sm:max-w-6xl sm:px-4">
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Lake Admin</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tiles.map(({ name, link, Icon, color }) => (
                    <Link key={name} href={link} className="block">
                        <Card className={`flex min-h-[120px] items-center justify-between gap-4 rounded-xl border-0 bg-gradient-to-br ${color} px-5 py-6 text-white shadow-lg transition-transform duration-200 hover:scale-[1.02] md:min-h-[150px] md:px-6`}>
                            <div className="flex flex-col gap-1">
                                <span className="text-lg font-semibold md:text-xl">{name}</span>
                                <span className="text-sm text-white/80">Open {name}</span>
                            </div>
                            <Icon className="h-10 w-10 shrink-0 md:h-12 md:w-12" />
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminPage;
