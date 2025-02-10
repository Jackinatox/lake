"use client";

import React from 'react';
import { Box, Card, CardCover, CardContent, Typography } from '@mui/joy';
import { useRouter } from 'next/navigation';
import { Gamepad2Icon, SquarePlay, UsersIcon } from 'lucide-react';

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
        // Add more sub-sites as needed
    ];

    return (
        <>
            <Box
                component="ul"
                sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 0, m: 0 }}
            >
                {subSites.map((site) => (
                    <Card
                        key={site.name}
                        onClick={() => router.push(site.link)}
                        sx={{
                            cursor: 'pointer', height: 200, width: 300, '&:hover': { boxShadow: 'md' },
                        }}
                    >
                        <CardCover>
                            <img src={site.imageUrl} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        </CardCover>
                        <CardContent sx={{ justifyContent: 'flex-end' }}>
                            <Typography level="body-lg" sx={{ color: '#000', mt: 'auto', display: 'inline-flex' }}>
                                {site.icon} &nbsp; {site.name}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </>
    );
};

export default AdminPage;
