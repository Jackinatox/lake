import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const TerminalComponent = forwardRef((props, ref) => {
    const terminalRef = useRef(null);
    const fitAddon = useRef(null);
    const term = useRef(null);

    useImperativeHandle(ref, () => ({
        sendData: (data) => {
            if (term.current) {
                term.current.write(data + '\r\n');
            }
        },
        clearTerminal: () => {
            if (term.current) {
                term.current.clear();
            }
        },
        resizeTerminal: () => {
            if (fitAddon.current) {
                fitAddon.current.fit();
            }
        },
    }));

    useEffect(() => {
        term.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
            },
        });

        fitAddon.current = new FitAddon();
        term.current.loadAddon(fitAddon.current);

        if (terminalRef.current) {
            term.current.open(terminalRef.current);
            fitAddon.current.fit();
        }

        term.current.onData((data) => {
            console.log('User typed:', data);
            
          });

        return () => {
            term.current.dispose();
        };
    }, []);

    return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
});

export default TerminalComponent;
