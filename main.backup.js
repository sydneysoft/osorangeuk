const { app, BrowserWindow, Menu } = require('electron');

app.setName('OrangeSoft Browser');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'OrangeSoft Browser',
    webPreferences: {
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
