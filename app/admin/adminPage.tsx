"use client";

import React from 'react';
import { Box, Card, CardCover, CardContent, Typography } from '@mui/joy';
import { useRouter } from 'next/navigation';

const AdminPage = () => {
    const router = useRouter();

    const subSites = [
        {
            name: 'Users',
            imageUrl: '/images/users.png',
            link: '/admin/user',
        },
        {
            name: 'Servers',
            imageUrl: '/images/servers.jpg',
            link: '/admin/servers',
        },
        {
            name: 'Nodes',
            imageUrl: '/images/nodes.jpg',
            link: '/admin/nodes',
        },
        // Add more sub-sites as needed
    ];

    return (<>
        <Box
            component="ul"
            sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 0, m: 0 }}
        >
            {subSites.map((site) => (
                <Card
                    key={site.name}
                    onClick={() => router.push(site.link)}
                    sx={{
                        cursor: 'pointer',
                        height: 200,
                        width: 300,
                        '&:hover': {
                            boxShadow: 'md',
                        },
                    }}
                >
                    <CardCover>
                        <img
                            src={site.imageUrl}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                    </CardCover>
                    <CardContent
                        sx={{
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Typography
                            level="body-lg"
                            sx={{ color: '#000', mt: 'auto' }}
                        >
                            {site.name}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </Box>
    </>
    );
};

export default AdminPage;
