const { app, BrowserWindow, dialog, ipcMain, globalShortcut } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width:410,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    transparent: true, // Set window background to transparent
    backgroundColor: '#00000000',
  });

  mainWindow.loadFile('index.html');

  return mainWindow;
}
ipcMain.on('ping', (event, message) => {
  console.log('Received message:', message);
  event.reply('pong', 'Hello from the main process!');
});
app.whenReady().then(() => {
  const mainWindow = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.on('open-folder-dialog', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      event.reply('folder-selected', result.filePaths[0]);
    }
  });

  ipcMain.on('get-files', (event, folderPath) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error(err);
        return;
      }

      const mp3Files = files.filter((file) => file.endsWith('.mp3'))
                             .map((file) => ({ name: file, path: path.join(folderPath, file) }));
      
      event.reply('files-list', mp3Files);
    });
  });
});


app.whenReady().then(() => {
  // ... (Your window creation code)

  // Register the global shortcut for F24
  globalShortcut.register('F24', () => {
      ipcRenderer.send('toggle-visibility'); 
  });
}); 
ipcMain.on('toggle-visibility', (event) => {
  let win = BrowserWindow.getFocusedWindow(); // Or BrowserWindow.getAllWindows()...
  if (win) { // Check if there's a window to toggle
      if (win.isVisible()) {
          win.hide();
      } else {
          win.show();
      }
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
