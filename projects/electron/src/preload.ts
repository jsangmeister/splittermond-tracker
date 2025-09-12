// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  loadCharacter: () => ipcRenderer.invoke('load-character'),
  confirm: (message: string) => ipcRenderer.invoke('confirm', message),
  showCredits: () => ipcRenderer.invoke('show-credits'),
  setWindowSize: (width: number, height: number) =>
    ipcRenderer.invoke('set-window-size', width, height),
  storage: {
    get: (key: string) => ipcRenderer.invoke('storage-get', key),
    set: (key: string, data: unknown) =>
      ipcRenderer.invoke('storage-set', key, data),
  },
});
