import React from 'react';
import { NodeModel as WingModel } from 'pterodactyl.js';
import Table from '@mui/joy/Table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface WingsTableProps {
  wings: WingModel[];
}

const WingsTable: React.FC<WingsTableProps> = ({ wings: wings }) => {
  return (
    <Table aria-label="user table" borderAxis="both" variant="outlined" sx={{ tableLayout: "auto" }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Location ID</th>
          <th>Disk (GB)</th>
          <th>Memory (GB)</th>
          <th>FQDN</th>
          <th>Edit</th>
        </tr>
      </thead>
      <tbody>
        {wings.map((wing) => (
          <tr key={wing.id}>
            <td>{wing.id}</td>
            <td>{wing.name}</td>
            <td>{wing.locationId}</td>
            <td>{wing.disk / 1000}</td>
            <td>{wing.memory / 1000}</td>
            <td>{wing.fqdn}</td>
            <td> <Link href={`/admin/wings/${wing.id}`}><Button>Edit</Button></Link> </td>
          </tr>
        ))}
      </tbody>
    </Table >
  );
};

export default WingsTable;
