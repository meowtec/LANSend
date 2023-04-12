import { NetInterface } from '#/types';
import { invoke as _invoke } from '@tauri-apps/api/tauri';

export interface TauriCommands {
  start_server: [
    {
      port: number;
    },
    void,
  ],

  stop_server: [
    void,
    void,
  ],

  is_running: [
    void,
    boolean,
  ],

  get_netifas: [
    void,
    NetInterface[],
  ],
}

export function invoke<T extends keyof TauriCommands>(name: T, params: TauriCommands[T][0]): Promise<TauriCommands[T][1]> {
  console.log(`[invoke] ${name} request`, params);
  return _invoke(name, params ?? {}).then((res) => {
    console.log(`[invoke] ${name} response`, res);
    return res as TauriCommands[T][1];
  });
}

export const invokes = new Proxy({}, {
  get: (target, name: keyof TauriCommands) => (params: TauriCommands[keyof TauriCommands][0]) => invoke(name, params),
}) as {
  [K in keyof TauriCommands]: (params: TauriCommands[K][0]) => Promise<TauriCommands[K][1]>;
};
