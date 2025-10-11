"use client"

import { deleteGameServers } from '@/app/actions/gameservers/deleteGameServers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/Pterodactyl/file-utils';
import { GameServerAdmin } from '@/models/prisma';
import React from 'react';

interface GameserversTableProps {
  servers: GameServerAdmin[];
}

const ServersTable: React.FC<GameserversTableProps> = ({ servers: gameservers }) => {
  const toast = useToast();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    // Call server action
    const result = await deleteGameServers(selectedIds);
    setSelectedIds([]);

    toast.toast({
      title: result.success ? "Success" : "Error",
      description: result.success ? "Game servers deleted successfully." : result.error,
      variant: result.success ? "default" : "destructive"
    });
  };

  return (

    <div>
      <button
        onClick={handleDelete}
        disabled={selectedIds.length === 0}
        className="mb-2 px-4 py-2 bg-red-600 text-white rounded"
      >
        Delete Selected
      </button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={selectedIds.length === gameservers.length && gameservers.length > 0}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedIds(gameservers.map(gs => gs.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>User</TableHead>
            <TableHead>CPU Percent</TableHead>
            <TableHead>RamMB</TableHead>
            <TableHead>Expieres</TableHead>
            <TableHead>Node/Location</TableHead>
            <TableHead>PT Server ID</TableHead>
            <TableHead>PT Internal ID</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gameservers.map((gameserver) => (
            <TableRow key={gameserver.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(gameserver.id)}
                  onChange={e => handleCheckboxChange(gameserver.id, e.target.checked)}
                />
              </TableCell>
              <TableCell>{gameserver.id}</TableCell>
              <TableCell>{gameserver.name}</TableCell>
              <TableCell>{gameserver.user.email}</TableCell>
              <TableCell>{gameserver.cpuPercent}</TableCell>
              <TableCell>{gameserver.ramMB}</TableCell>
              <TableCell>{formatDate(gameserver.expires.toString())}</TableCell>
              <TableCell>{gameserver.location.name}</TableCell>
              <TableCell>{gameserver.ptServerId}</TableCell>
              <TableCell>{gameserver.ptAdminId}</TableCell>
              <TableCell>{gameserver.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ServersTable;
