import React from 'react';
import { NodeModel, UserModel } from 'pterodactyl.js';
import Table from '@mui/joy/Table';

interface NodesTableProps {
  nodes: NodeModel[];
}

const NodeTable: React.FC<NodesTableProps> = ({ nodes }) => {
  return (
    <Table aria-label="user table" variant='outlined'>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Location ID</th>
          <th>Disk</th>
          <th>Memoy</th>
          <th>FQDN</th>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node) => (
          <tr key={node.id}>
            <td>{node.id}</td>
            <td>{node.name}</td>
            <td>{node.locationId}</td>
            <td>{node.disk}</td>
            <td>{node.memory}</td>
            <td>{node.fqdn}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default NodeTable;
