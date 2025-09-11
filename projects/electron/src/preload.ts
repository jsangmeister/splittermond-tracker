// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  loadCharacter: () => ipcRenderer.invoke('load-character'),
  storage: {
    get: (key: string) => ipcRenderer.invoke('storage-get', key),
    set: (key: string, data: unknown) => ipcRenderer.invoke('storage-set', key, data),
  }
});
