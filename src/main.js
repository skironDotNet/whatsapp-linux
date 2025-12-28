const { app, BrowserWindow, session, shell } = require('electron');
const path = require('path');

(async () => {
  const contextMenu = await import('electron-context-menu');

  contextMenu.default({
    showSearchWithGoogle: false,
    showCopyImage: true,
    showSaveImage: true,
    showInspectElement: true,
    prepend: (defaultActions, params, browserWindow) => {
      const suggestions = params.dictionarySuggestions || [];
      if (suggestions.length > 0) {
        return suggestions.map(suggestion => ({
          label: suggestion,
          click: () => browserWindow.webContents.replaceMisspelling(suggestion)
        }));
      }
      return [];
    }
  });

  let mainWindow;

  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(__dirname, 'assets/whatsapp.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        spellcheck: true
      }
    });

    const spoofedUserAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      delete details.requestHeaders["Electron"];
      details.requestHeaders["User-Agent"] = spoofedUserAgent;
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    mainWindow.loadURL('https://web.whatsapp.com');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.includes('web.whatsapp.com')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
})();

