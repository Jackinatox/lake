"use client";


import React from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2Icon, icons, SquarePlay, UsersIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AdminPage = () => {
    const router = useRouter();

    const subSites = [
        {
            icon: <UsersIcon />,
            name: 'Users',
            imageUrl: '/images/users.png',
            link: '/admin/users',
        },
        {
            icon: <Gamepad2Icon />,
            name: 'Gameservers',
            imageUrl: '/images/gameservers.jpg',
            link: '/admin/gameservers',
        },
        {
            icon: <SquarePlay />,
            name: 'Wings',
            imageUrl: '/images/wings.jpg',
            link: '/admin/wings',
        },
        {
            icon: <SquarePlay />,
            name: "Provision By Id",
            imageUrl: '/images/wings.jpg',
            link: "/admin/TestInternalFunctions/provisionById"
        }
        // Add more sub-sites as needed
    ];

    return (
        <div className="flex flex-wrap gap-4 p-0 m-0">
            {subSites.map((site) => (
                <div
                    key={site.name}
                    className="w-[300px] h-[200px] cursor-pointer transition-transform hover:scale-[1.04]"
                    onClick={() => router.push(site.link)}
                >
                    <Card className="overflow-hidden w-full h-full flex flex-col justify-end p-0 shadow-lg">
                        <div className="relative w-full h-[130px]">
                            <img
                                src={site.imageUrl}
                                alt={site.name}
                                className="object-cover w-full h-full"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <CardContent className="flex items-center gap-2 pt-4 pb-4">
                            {site.icon}
                            <span className="font-semibold text-lg">{site.name}</span>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
};

export default AdminPage;
