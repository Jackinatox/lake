import React from 'react';
import { UserModel } from 'pterodactyl.js';
import Table from '@mui/joy/Table';

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
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.username}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserTable;
