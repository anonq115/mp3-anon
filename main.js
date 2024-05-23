const { app, BrowserWindow, dialog, ipcMain, globalShortcut, screen } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let stickyBoxWindow;
let isDialogOpen = false;


function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 410,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
  });

  mainWindow.loadFile('index.html');


 
  return mainWindow;
}

function createStickyBoxWindow() {
  stickyBoxWindow = new BrowserWindow({
    width: 300,
    height: 500,
    x: 1620,
    y: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      contentSecurityPolicy: "script-src 'self';"
    },
  });

  stickyBoxWindow.loadFile(path.join(__dirname, 'sticky-box.html')); // Load the HTML file
  stickyBoxWindow.setIgnoreMouseEvents(true);
  stickyBoxWindow.setAlwaysOnTop(true, 'screen-saver', 1); // Set as always on top
  stickyBoxWindow.setAlwaysOnTop(true, 'pop-up-menu');
  return stickyBoxWindow;

}



ipcMain.on('ping', (event, message) => {
  console.log('Received message:', message);
  event.reply('pong', 'Hello from the main process!');
});

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  stickyBoxWindow = createStickyBoxWindow();

  let isMainWindowOffScreen = false;
  let mainWindowBounds = null;
  
  globalShortcut.register('F24', () => {
    console.log('F24 key pressed');
    if (!isMainWindowOffScreen) {
      console.log('Moving window off-screen');
      mainWindowBounds = mainWindow.getBounds();
      //coords solution because the animation to sticky-box.html stops working if you minimize the index.html window this might be screen specific so adjust accordingly
      //1164 is the max where i can fully 'off screen' the index.html window so that it dont get in the way
      mainWindow.setBounds({ x: mainWindowBounds.x + 1164, y: mainWindowBounds.y + 817, width: mainWindowBounds.width, height: mainWindowBounds.height });
      isMainWindowOffScreen = true;
    } else {
      console.log('Moving window back to its original position');
      mainWindow.setBounds(mainWindowBounds);
      isMainWindowOffScreen = false;
    }
  });
  
  /*if dialog clicked or on diologue do not close the main window even tho were not clicking on it if clicking outside window and dialogues are not open offscreen the window
  using coords*/ 
  mainWindow.on('close', () => {
    if (stickyBoxWindow) {
      stickyBoxWindow.close();
    }
  });
  
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
  
  mainWindow.on('blur', () => {
    console.log('Main window blur event');
    console.log('isDialogOpen:', isDialogOpen);
    if (!isDialogOpen && !stickyBoxWindow?.isFocused()) {
      if (!isMainWindowOffScreen) {
        console.log('Moving window off-screen');
        mainWindowBounds = mainWindow.getBounds();
        mainWindow.setBounds({
          x: mainWindowBounds.x + 1164,
          y: mainWindowBounds.y + 817,
          width: mainWindowBounds.width,
          height: mainWindowBounds.height
        });
        isMainWindowOffScreen = true;
      } else {
        console.log('Moving window back to its original position');
        mainWindow.setBounds(mainWindowBounds);
        isMainWindowOffScreen = false;
      }
    }
  });
 /* ipcMain.on('audio-data-sent', (event, filePath) => {
    console.log(`Audio data sent to sticky-box.html was received by sticky-box.html successfully: ${filePath}`);
  });
  */
  ipcMain.on('open-folder-dialog', async (event) => {
    isDialogOpen = true; // Set flag to true before opening the dialog
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      modal: false // Add this line to prevent the dialog from hiding the main window

    });
    isDialogOpen = false; // Set flag to false after the dialog is closed

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


ipcMain.on('audio-analyzed-data', (event, dataArray) => {
    if (stickyBoxWindow) {
      stickyBoxWindow.webContents.send('audio-analyzed-data', dataArray);
    }
});




ipcMain.on('message-to-main', (event, message) => {
  console.log('Message received in main process:', message);
  if (stickyBoxWindow) {
      stickyBoxWindow.webContents.send('message-from-main', message);
  }
});

//ipc main receieves message from index.html to pass to sticky-box.html