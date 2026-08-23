// Source-level spike only.
//
// In a real Canopy experiment these wrappers should live in the canonical
// `src/ipc.ts` boundary rather than creating a second IPC owner.

import { invoke } from "@tauri-apps/api/core";

export interface RuntimeContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: string;
}

export const runtimeListContainers = () =>
  invoke<RuntimeContainer[]>("runtime_list_containers");

export const runtimeStopContainer = (id: string) =>
  invoke<void>("runtime_stop_container", { id });

export const runtimeRestartContainer = (id: string) =>
  invoke<void>("runtime_restart_container", { id });

export const runtimeContainerLogs = (id: string, tail = 100) =>
  invoke<string>("runtime_container_logs", { id, tail });
