import { app, dialog, ipcMain } from 'electron';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { store } from './store';
import { StoreKey } from '../../shared/store-keys';
import * as xml2js from 'xml2js';

const parser = new xml2js.Parser({ explicitArray: false });

async function changeBaseFolder(): Promise<string | undefined> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    defaultPath: app.getPath('home'),
    properties: ['openDirectory'],
  });
  if (!canceled) {
    const basePath = filePaths[0];
    store.set(StoreKey.BASE_CHARACTER_PATH, basePath);
    return basePath;
  }
}

export function initIpc(): void {
  ipcMain.handle('get-characters', async () => {
    let basePath =
      store.get(StoreKey.BASE_CHARACTER_PATH) ??
      path.join(app.getPath('home'), 'rpgframework', 'player', 'myself');
    while (true) {
      const files = existsSync(basePath)
        ? readdirSync(basePath, { withFileTypes: true, recursive: true })
        : [];
      const charFiles = [];
      for (const file of files) {
        if (file.isFile() && file.name === 'index.xml') {
          const fullPath = path.join(file.parentPath, file.name);
          const xmlContent = readFileSync(fullPath, { encoding: 'utf-8' });
          const result = await parser.parseStringPromise(xmlContent);
          try {
            let entries = result.index.entry;
            if (!Array.isArray(entries)) {
              entries = [entries];
            }
            for (const entry of entries) {
              const filename = entry.$.file;
              if (filename.endsWith('.xml')) {
                charFiles.push(path.join(file.parentPath, filename));
              }
            }
          } catch (e: any) {
            console.log(
              `${fullPath} seems to have an invalid format. Skipping... (Reason: ${e.message})`,
            );
          }
        }
      }

      const contents = [];
      for (const charFile of charFiles) {
        const xmlContent = readFileSync(charFile, { encoding: 'utf-8' });
        contents.push({
          path: charFile,
          content: xmlContent,
        });
      }

      if (contents.length === 0) {
        await dialog.showMessageBox({
          message: `Im Verzeichnis "${basePath}" wurden keine Charakterdateien gefunden. Bitte wähle den Ordner aus, in dem sich deine Charakterdateien befinden.`,
        });
        basePath = (await changeBaseFolder()) ?? basePath;
      } else {
        return contents;
      }
    }
  });

  ipcMain.handle('change-base-folder', async () => {
    await changeBaseFolder();
  });

  ipcMain.handle('storage-get', (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('storage-set', (_, key: string, data: unknown) => {
    store.set(key, data);
  });
}
