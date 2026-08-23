import { Channel, invoke } from '@tauri-apps/api/core';

export interface PtySessionInfo {
  terminalId: string;
  pid: number | null;
  shell: string;
  cwd: string;
}

export type PtyEvent =
  | {
      event: 'output';
      data: { terminalId: string; data: string };
    }
  | {
      event: 'exit';
      data: { terminalId: string; exitCode: number | null };
    }
  | {
      event: 'error';
      data: { terminalId: string; message: string };
    };

export interface PtyConnection {
  session: PtySessionInfo;
  channel: Channel<PtyEvent>;
}

export async function startPty(
  cols: number,
  rows: number,
  onEvent: (event: PtyEvent) => void,
): Promise<PtyConnection> {
  const channel = new Channel<PtyEvent>();
  channel.onmessage = onEvent;

  const session = await invoke<PtySessionInfo>('start_pty', {
    cols,
    rows,
    onEvent: channel,
  });

  return { session, channel };
}

export async function writePty(terminalId: string, data: string): Promise<void> {
  await invoke('write_pty', { terminalId, data });
}

export async function resizePty(
  terminalId: string,
  cols: number,
  rows: number,
): Promise<void> {
  await invoke('resize_pty', { terminalId, cols, rows });
}

export async function killPty(terminalId: string): Promise<void> {
  await invoke('kill_pty', { terminalId });
}
