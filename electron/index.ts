// Native
import { join } from 'path';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, nativeTheme, screen } from 'electron';
import isDev from 'electron-is-dev';
import db, { runDBFunction } from './db';

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  const window = new BrowserWindow({
    width,
    height,
    //  change to false to use AppBar
    frame: true,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../dist-vite/index.html');

  // and load the index.html of the app.
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  // Open the DevTools.
  window.webContents.openDevTools();

  // For AppBar
  ipcMain.on('minimize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMinimized() ? window.restore() : window.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMaximized() ? window.restore() : window.maximize();
  });

  ipcMain.on('close', () => {
    window.close();
  });

  nativeTheme.themeSource = 'dark';
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send('message', 'common.hiElectron'), 500);
});

// app logic here
let crawlerRunning = false;
ipcMain.handle('start-crawl', async () => {
  crawlerRunning = true;

  while (crawlerRunning) {
    // get config, urls, threads from db
    const threads = runDBFunction.getConfigValue({ key: 'threads' });
    const urls = runDBFunction.getProductsByStatus({ status: 'import', limit: `${threads}` });
    if (urls.length < 1) {
      console.log('No more urls to crawl');
      crawlerRunning = false;
      break;
    }
    console.log('start-crawl', { urls: urls.length, threads });
  }

  console.log('Crawl stopped');
  crawlerRunning = false;
});

ipcMain.handle('stop-crawl', async () => {
  crawlerRunning = false;
});

ipcMain.handle('is-crawler-running', () => {
  return crawlerRunning;
});

// get database
ipcMain.handle('database', (_, { functionName, functionParams }: { functionName: string; functionParams: any }) => {
  const stmt = (runDBFunction as any)[functionName];
  console.log('database', { functionName, functionParams });
  if (!stmt) {
    throw new Error(`Function ${functionName} not found`);
  }
  // console.log('stmt', stmt.toString());
  return stmt({ ...functionParams });
});
