import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import WinState from 'electron-win-state';
import { store } from './store';
import { StoreKey } from '../../shared/store-keys';
import * as xml2js from 'xml2js';

let mainWindow: BrowserWindow | null;

const parser = new xml2js.Parser({ explicitArray: false });

if (app.isPackaged) {
  void autoUpdater.checkForUpdatesAndNotify();
}
// force file dialog version to support defaultPath on Linux
app.commandLine.appendSwitch('xdg-portal-required-version', '4');

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = WinState.createBrowserWindow({
    width: 1400,
    height: 1100,
    winState: {
      storeFrameOption: true,
      dev: !app.isPackaged,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
  });

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, 'splittermond-tracker', 'index.html')}`
    : `http://localhost:4200`;

  void mainWindow.loadURL(startURL);
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
void app.whenReady().then(() => {
  createWindow();

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
          } catch (e) {
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
        const { canceled, filePaths } = await dialog.showOpenDialog({
          defaultPath: app.getPath('home'),
          properties: ['openDirectory'],
        });
        if (!canceled) {
          basePath = filePaths[0];
          store.set(StoreKey.BASE_CHARACTER_PATH, basePath);
        }
      } else {
        return contents;
      }
    }
  });

  ipcMain.handle('storage-get', (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('storage-set', (_, key: string, data: unknown) => {
    store.set(key, data);
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
