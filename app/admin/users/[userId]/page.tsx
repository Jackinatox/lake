// app/admin/user/[userId]/page.tsx
import { Box, Breadcrumbs, Button, Link, Table, Typography } from '@mui/joy';
import { TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { PencilLine, SettingsIcon, UserIcon } from 'lucide-react';
import { Builder } from 'pterodactyl.js';
import React from 'react'

async function User({ params }: { params: Promise<{ userId: string }> }) {
    const userId = (await params).userId;

    const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    const apiKey = process.env.PTERODACTYL_API_KEY;

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

    try {
        const user = await client.getUser(userId);





        return (
            <>
                <Breadcrumbs separator="›" aria-label="breadcrumbs">

                    <Link color="primary" href="/admin">
                        <SettingsIcon />
                        Admin Panel
                    </Link>

                    <Link color="primary" href="/admin/users">
                        <UserIcon />
                        User
                    </Link>

                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        <PencilLine /> &nbsp;
                        {user.id} - {user.username}
                    </Typography>
                    
                </Breadcrumbs>



                <Box sx={{ overflow: "auto" }}>
                    <Box sx={{ width: "100%", display: "table" }}>

                        <Table borderAxis="both" variant="outlined" sx={{ tableLayout: "auto" }}>
                            <TableHead >
                                <TableRow>
                                    <TableCell>id          </TableCell>
                                    <TableCell>externalId  </TableCell>
                                    <TableCell>uuid        </TableCell>
                                    <TableCell>internalId  </TableCell>
                                    <TableCell>username    </TableCell>
                                    <TableCell>email       </TableCell>
                                    <TableCell>firstName   </TableCell>
                                    <TableCell>lastName    </TableCell>
                                    <TableCell>fullName    </TableCell>
                                    <TableCell>language    </TableCell>
                                    <TableCell>rootAdmin   </TableCell>
                                    <TableCell>twoFactor   </TableCell>
                                    <TableCell>updatedAt   </TableCell>
                                    <TableCell>createdAt   </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{user.id}          </TableCell>
                                    <TableCell>{user.externalId}  </TableCell>
                                    <TableCell>{user.uuid}        </TableCell>
                                    <TableCell>{user.internalId}  </TableCell>
                                    <TableCell>{user.username}    </TableCell>
                                    <TableCell>{user.email}       </TableCell>
                                    <TableCell>{user.firstName}   </TableCell>
                                    <TableCell>{user.lastName}    </TableCell>
                                    <TableCell>{user.fullName}    </TableCell>
                                    <TableCell>{user.language}    </TableCell>
                                    <TableCell>{user.rootAdmin}   </TableCell>
                                    <TableCell>{user.twoFactor}   </TableCell>
                                    <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                    </Box>
                </Box>


            </>
        )
    } catch (e) {
        return (
            <div>{JSON.stringify(e)}</div>
        )
    }
}

export default User



