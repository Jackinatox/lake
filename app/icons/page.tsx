import { Table, Sheet } from '@mui/joy'
import { Gamepad2Icon, SettingsIcon, SquarePlay, UsersIcon, PencilLine, } from 'lucide-react'
import React from 'react'

function Icons() {

    const icons = [
        {
            id: 1,
            icon: <SettingsIcon />,
            name: 'Admin',
            code: '<SettingsIcon />',
        },
        {
            id: 1,
            icon: <UsersIcon />,
            name: 'Users',
            code: '<UsersIcon />',
        },
        {
            id: 2,
            icon: <Gamepad2Icon />,
            name: 'Gameservers',
            code: '<UsersIcon />',
        },
        {
            id: 2,
            icon: <SquarePlay />,
            name: 'Wings',
            code: '<SquarePlay />',
        },
        {
            id: 2,
            _icon: <PencilLine />,
            get icon() {
                return this._icon;
            },
            set icon(value) {
                this._icon = value;
            },
            name: 'Edit',
            code: '<PencilLine />',
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
                                <td>{line.name}</td>
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
