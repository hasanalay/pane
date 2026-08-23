import { useEffect, useRef, useState } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTermTerminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import './terminal.css';
import { killPty, resizePty, startPty, writePty, type PtyEvent } from './terminalApi';

interface TerminalPaneProps {
  workspaceRoot: string;
}

type TerminalStatus = 'starting' | 'running' | 'exited' | 'error';

export function TerminalPane({ workspaceRoot }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<TerminalStatus>('starting');
  const [shellName, setShellName] = useState('shell');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let resizeFrame = 0;
    const terminal = new XTermTerminal({
      cursorBlink: true,
      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.2,
      scrollback: 5000,
      allowProposedApi: false,
      theme: {
        background: '#0b0c0e',
        foreground: '#d9dad6',
        cursor: '#e8e8e4',
        selectionBackground: '#3a3e45',
      },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    const handleEvent = (event: PtyEvent) => {
      if (disposed) return;

      if (event.event === 'output') {
        terminal.write(event.data.data);
        return;
      }

      if (event.event === 'exit') {
        setStatus('exited');
        terminal.writeln(
          `\r\n\x1b[90m[Pane] terminal exited${
            event.data.exitCode === null ? '' : ` (${event.data.exitCode})`
          }\x1b[0m`,
        );
        return;
      }

      setStatus('error');
      terminal.writeln(`\r\n\x1b[31m[Pane] ${event.data.message}\x1b[0m`);
    };

    const start = async () => {
      try {
        const connection = await startPty(terminal.cols, terminal.rows, handleEvent);
        if (disposed) {
          await killPty(connection.session.terminalId).catch(() => undefined);
          return;
        }

        sessionIdRef.current = connection.session.terminalId;
        setShellName(connection.session.shell.split('/').at(-1) ?? connection.session.shell);
        setStatus('running');
        terminal.focus();
      } catch (error) {
        if (disposed) return;
        setStatus('error');
        terminal.writeln(`\x1b[31m[Pane] failed to start terminal: ${String(error)}\x1b[0m`);
      }
    };

    const dataDisposable = terminal.onData((data) => {
      const terminalId = sessionIdRef.current;
      if (!terminalId) return;
      void writePty(terminalId, data).catch((error) => {
        setStatus('error');
        terminal.writeln(`\r\n\x1b[31m[Pane] terminal input failed: ${String(error)}\x1b[0m`);
      });
    });

    const resizeDisposable = terminal.onResize(({ cols, rows }) => {
      const terminalId = sessionIdRef.current;
      if (!terminalId) return;
      void resizePty(terminalId, cols, rows).catch(() => undefined);
    });

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (!disposed) fitAddon.fit();
      });
    });
    observer.observe(container);

    void start();

    return () => {
      disposed = true;
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      dataDisposable.dispose();
      resizeDisposable.dispose();
      terminal.dispose();

      const terminalId = sessionIdRef.current;
      sessionIdRef.current = null;
      if (terminalId) void killPty(terminalId).catch(() => undefined);
    };
  }, [workspaceRoot]);

  return (
    <section className="terminal-pane">
      <header className="terminal-header">
        <div className="terminal-title">
          <span>Terminal</span>
          <span className={`terminal-status terminal-status-${status}`}>{status}</span>
        </div>
        <span className="terminal-shell">{shellName}</span>
      </header>
      <div className="terminal-xterm" ref={containerRef} />
    </section>
  );
}
