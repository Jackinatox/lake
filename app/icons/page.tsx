import { Table, Sheet } from '@mui/joy'
import { Gamepad2Icon, SettingsIcon, SquarePlay, UsersIcon, PencilLine, CircleStop, Power, RotateCcw, Play, Server, } from 'lucide-react'
import React from 'react'

function Icons() {

    const icons = [
        {
            id: 1,
            icon: <SettingsIcon />,
            usage: 'Admin',
            code: '<SettingsIcon />',
        },
        {
            id: 2,
            icon: <UsersIcon />,
            usage: 'Users',
            code: '<UsersIcon />',
        },
        {
            id: 3,
            icon: <Gamepad2Icon />,
            usage: 'Gameservers',
            code: '<UsersIcon />',
        },
        {
            id: 4,
            icon: <SquarePlay />,
            usage: 'Wings',
            code: '<SquarePlay />',
        },
        {
            id: 5,
            icon: <PencilLine />,
            usage: 'Edit',
            code: '<PencilLine />',
        },
        {
            id: 6,
            icon: <Server />,
            usage: '**GAMESERVER**',
            code: '<Server />',
        },
        {
            id: 7,
            icon: <Play />,
            usage: 'Start',
            code: '<Play />',
        },
        {
            id: 8,
            icon: <RotateCcw />,
            usage: 'Restart',
            code: '<RotateCcw />',
        },
        {
            id: 9,
            icon: <Power />,
            usage: 'Stop',
            code: '<Power />',
        },
        {
            id: 10,
            icon: <CircleStop />,
            usage: 'Kill',
            code: '<CircleStop />',
        },
        {
            id: 11,
            icon: '',
            usage: '',
            code: '',
        },
    ];

    return (
        <>
            {'&nbsp;'}
            <Sheet>
                <Table borderAxis="both" variant="outlined" sx={{ tableLayout: "auto" }}>
                    <thead>
                        <tr>
                            <th>Icon</th>
                            <th>Usage</th>
                            <th>Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        {icons.map((line) => (
                            <tr key={line.id}>
                                <td>{line.icon}</td>
                                <td>{line.usage}</td>
                                <td>{line.code}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet >
        </>
    )
}

export default Icons
