import { app, BrowserWindow } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import WinState from 'electron-win-state';
import { initIpc } from './ipc';

let mainWindow: BrowserWindow | null;

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
    frame: true,
    show: false,
    winState: {
      dev: !app.isPackaged,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', '..', '..', 'img', '512x512.png'),
  });
  mainWindow.maximize();
  mainWindow.show();

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, '..', '..', 'splittermond-tracker', 'index.html')}`
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
  initIpc();
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
