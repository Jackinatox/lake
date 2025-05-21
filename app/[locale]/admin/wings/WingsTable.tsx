import React from 'react';
import { NodeModel as WingModel } from 'pterodactyl.js';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface WingsTableProps {
  wings: WingModel[];
}

const WingsTable: React.FC<WingsTableProps> = ({ wings: wings }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Location ID</TableHead>
          <TableHead>Disk (GB)</TableHead>
          <TableHead>Memory (GB)</TableHead>
          <TableHead>FQDN</TableHead>
          <TableHead>Edit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {wings.map((wing) => (
          <TableRow key={wing.id}>
            <TableCell>{wing.id}</TableCell>
            <TableCell>{wing.name}</TableCell>
            <TableCell>{wing.locationId}</TableCell>
            <TableCell>{wing.disk / 1000}</TableCell>
            <TableCell>{wing.memory / 1000}</TableCell>
            <TableCell>{wing.fqdn}</TableCell>
            <TableCell>
              <Link href={`/admin/wings/${wing.id}`}>
                <Button>Edit CPU</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WingsTable;
