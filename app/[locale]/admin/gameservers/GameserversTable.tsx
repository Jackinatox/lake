import React from 'react';
import { ServerModel as GameserverModel } from 'pterodactyl.js';

// Import Shadcn Table components
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface GameserversTableProps {
  servers: GameserverModel[];
}

const ServersTable: React.FC<GameserversTableProps> = ({ servers: gameservers }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Descr</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Node</TableHead>
          <TableHead>Allocation</TableHead>
          <TableHead>Nest</TableHead>
          <TableHead>Egg</TableHead>
          <TableHead>Pack</TableHead>
          <TableHead>externalId</TableHead>
          <TableHead>internalId</TableHead>
          <TableHead>uuid</TableHead>
          <TableHead>identifier</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gameservers.map((gameserver) => (
          <TableRow key={gameserver.id}>
            <TableCell>{gameserver.id}</TableCell>
            <TableCell>{gameserver.name}</TableCell>
            <TableCell>{gameserver.description}</TableCell>
            <TableCell>{gameserver.user}</TableCell>
            <TableCell>{gameserver.node}</TableCell>
            <TableCell>{gameserver.allocation}</TableCell>
            <TableCell>{gameserver.nest}</TableCell>
            <TableCell>{gameserver.egg}</TableCell>
            <TableCell>{gameserver.pack}</TableCell>
            <TableCell>{gameserver.externalId}</TableCell>
            <TableCell>{gameserver.internalId}</TableCell>
            <TableCell>{gameserver.uuid}</TableCell>
            <TableCell>{gameserver.identifier}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ServersTable;
