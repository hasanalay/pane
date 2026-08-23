// Source-level spike only.
//
// This intentionally keeps presentation minimal. The architectural question is
// whether runtime state can travel through Canopy's native owner -> Tauri IPC ->
// React projection boundary without creating a second process/state system.

import { useCallback, useEffect, useState } from "react";
import {
  runtimeContainerLogs,
  runtimeListContainers,
  runtimeRestartContainer,
  runtimeStopContainer,
  type RuntimeContainer,
} from "./runtime-ipc";

export function RuntimePanel() {
  const [containers, setContainers] = useState<RuntimeContainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ name: string; text: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContainers(await runtimeListContainers());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const act = async (operation: () => Promise<void>) => {
    setError(null);
    try {
      await operation();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const openLogs = async (container: RuntimeContainer) => {
    setError(null);
    try {
      const text = await runtimeContainerLogs(container.id, 100);
      setLogs({ name: container.name, text });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section aria-label="Runtime" style={{ display: "grid", gap: 8 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <strong>Runtime</strong>
        <span style={{ opacity: 0.7 }}>{containers.length} containers</span>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <div role="alert">{error}</div>}

      {containers.map((container) => {
        const running = container.state === "running";
        return (
          <div
            key={container.id}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px, 1fr) minmax(140px, 1fr) auto",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div>
              <strong>{container.name}</strong>
              <div style={{ opacity: 0.65, fontSize: 12 }}>{container.image}</div>
            </div>

            <div>
              <span>{container.status || container.state}</span>
              {container.ports && (
                <div style={{ opacity: 0.65, fontSize: 12 }}>{container.ports}</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => void openLogs(container)}>
                Logs
              </button>
              <button
                type="button"
                onClick={() => void act(() => runtimeRestartContainer(container.id))}
              >
                Restart
              </button>
              {running && (
                <button
                  type="button"
                  onClick={() => void act(() => runtimeStopContainer(container.id))}
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!loading && containers.length === 0 && !error && (
        <div style={{ opacity: 0.7 }}>No containers found.</div>
      )}

      {logs && (
        <div>
          <header style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <strong>{logs.name} logs</strong>
            <button type="button" onClick={() => setLogs(null)}>
              Close
            </button>
          </header>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>
            {logs.text}
          </pre>
        </div>
      )}
    </section>
  );
}
