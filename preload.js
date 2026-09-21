const {
  contextBridge,
  ipcRenderer
} = require('electron');


contextBridge.exposeInMainWorld(
  'orangeSoft',
  {

    focusBrowserUI() {

      return ipcRenderer.invoke(
        'focus-browser-ui'
      );

    }

  }
);