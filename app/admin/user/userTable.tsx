import React from 'react';
import { UserModel } from 'pterodactyl.js';
import Table from '@mui/joy/Table';
import { Box, Button } from '@mui/joy';
import { redirect } from 'next/dist/server/api-utils';
import Link from 'next/link';

interface UserTableProps {
  users: UserModel[];
}

const UserTable: React.FC<UserTableProps> = ({ users }) => {
  return (
    <Table aria-label="user table" variant='outlined'>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Edit</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button component={Link} href={`user/${user.id}`} size="sm" variant="plain" color="neutral">
                  Edit
                </Button>
              </Box>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserTable;
