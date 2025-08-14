"use client"

import React, { useState } from 'react';
import { useWebSocket } from './useWebSocket';

export function ServerConsole({ serverId, apiKey }) {
  const [command, setCommand] = useState('');
  const {
    isConnected,
    console,
    serverStatus,
    stats,
    sendCommand,
    setPowerState
  } = useWebSocket(serverId, apiKey);

  const handleSendCommand = (e) => {
    e.preventDefault();
    if (command.trim()) {
      sendCommand(command);
      setCommand('');
    }
  };

  return (
    <div className="server-console">
      <div className="server-status">
        <span className={`status ${serverStatus}`}>
          {serverStatus.toUpperCase()}
        </span>
        <span className={`connection ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="power-controls">
        <button onClick={() => setPowerState('start')}>Start</button>
        <button onClick={() => setPowerState('restart')}>Restart</button>
        <button onClick={() => setPowerState('stop')}>Stop</button>
        <button onClick={() => setPowerState('kill')}>Kill</button>
      </div>

      {stats && (
        <div className="server-stats">
          <div>CPU: {stats.cpu_absolute}%</div>
          <div>Memory: {(stats.memory_bytes / 1024 / 1024).toFixed(2)} MB</div>
        </div>
      )}

      <div className="console-output">
        {console.map((line, index) => (
          <div key={index} className="console-line">
            {line}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendCommand} className="command-input">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          disabled={!isConnected || serverStatus !== 'running'}
        />
        <button type="submit" disabled={!isConnected || serverStatus !== 'running'}>
          Send
        </button>
      </form>
    </div>
  );
}