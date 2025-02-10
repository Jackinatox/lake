import React from 'react';
import { ServerModel as GameserverModel } from 'pterodactyl.js';
import Table from '@mui/joy/Table';

interface GameserversTableProps {
  servers: GameserverModel[];
}

const ServersTable: React.FC<GameserversTableProps> = ({ servers: gameservers }) => {
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
        {gameservers.map((gameserver) => (
          <tr key={gameserver.id}>
            <td>{gameserver.id}</td>
            <td>{gameserver.name}</td>
            <td>{gameserver.description}</td>
            <td>{gameserver.user}</td>
            <td>{gameserver.node}</td>
            <td>{gameserver.allocation}</td>
            <td>{gameserver.nest}</td>
            <td>{gameserver.egg}</td>
            <td>{gameserver.pack}</td>
            
            <td>{gameserver.externalId}</td>
            <td>{gameserver.internalId}</td>
            <td>{gameserver.uuid}</td>
            <td>{gameserver.identifier}</td>
            
          </tr>
        ))}
      </tbody>
    </Table >
  );
};

export default ServersTable;
