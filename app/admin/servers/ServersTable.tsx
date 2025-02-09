import React from 'react';
import { ServerModel } from 'pterodactyl.js';
import Table from '@mui/joy/Table';

interface ServersTableProps {
  servers: ServerModel[];
}

const ServersTable: React.FC<ServersTableProps> = ({ servers }) => {
  return (
    <Table aria-label="user table" borderAxis="both" variant="outlined" sx={{ tableLayout: "auto" }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Descr</th>
          <th>User</th>
          <th>Node</th>
          <th>Allocation</th>
          <th>Nest</th>
          <th>Egg</th>
          <th>Pack</th>

          <th>externalId</th>
          <th>internalId</th>
          <th>uuid</th>
          <th>identifier</th>
        </tr>
      </thead>
      <tbody>
        {servers.map((server) => (
          <tr key={server.id}>
            <td>{server.id}</td>
            <td>{server.name}</td>
            <td>{server.description}</td>
            <td>{server.user}</td>
            <td>{server.node}</td>
            <td>{server.allocation}</td>
            <td>{server.nest}</td>
            <td>{server.egg}</td>
            <td>{server.pack}</td>
            
            <td>{server.externalId}</td>
            <td>{server.internalId}</td>
            <td>{server.uuid}</td>
            <td>{server.identifier}</td>
            
          </tr>
        ))}
      </tbody>
    </Table >
  );
};

export default ServersTable;
