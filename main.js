const {
  app,
  BrowserWindow,
  Menu,
  protocol,
  net,
  ipcMain
} = require('electron');

const path = require('path');
const { pathToFileURL } = require('url');


/* --------------------------------
   APP
-------------------------------- */

app.setName('OrangeSoft Browser');

app.setPath(
  'userData',
  path.join(
    app.getPath('appData'),
    'OrangeSoft Browser'
  )
);


/* --------------------------------
   ORANGESOFT INTERNAL PROTOCOL
-------------------------------- */

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'orangesoft',

    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);


/* --------------------------------
   WINDOW
-------------------------------- */

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


  /* --------------------------------
     MAC MENU
  -------------------------------- */

      const template = [

              {
                label: 'OrangeSoft Browser',

                submenu: [

                  {
                    role: 'about',
                    label: 'About OrangeSoft Browser'
                  },

                  {
                    type: 'separator'
                  },

                  {
                    role: 'hide',
                    label: 'Hide OrangeSoft Browser'
                  },

                  {
                    role: 'hideOthers',
                    label: 'Hide Others'
                  },

                  {
                    role: 'unhide',
                    label: 'Show All'
                  },

                  {
                    type: 'separator'
                  },

                  {
                    role: 'quit',
                    label: 'Quit OrangeSoft Browser'
                  }

                ]
              },


              {
                label: 'File',

                submenu: [
                  {
                    role: 'close'
                  }
                ]
              },


              {
                label: 'Edit',

                submenu: [

                  { role: 'undo' },
                  { role: 'redo' },

                  { type: 'separator' },

                  { role: 'cut' },
                  { role: 'copy' },
                  { role: 'paste' },
                  { role: 'selectAll' }

                ]
              },


              {
                label: 'View',

                submenu: [

                  { role: 'reload' },
                  { role: 'forceReload' },
                  { role: 'toggleDevTools' },

                  { type: 'separator' },

                  { role: 'resetZoom' },
                  { role: 'zoomIn' },
                  { role: 'zoomOut' },

                  { type: 'separator' },

                  { role: 'togglefullscreen' }

                ]
              },


              {
                  label: 'Window',

                  submenu: [
                      { role: 'minimize' },
                      { role: 'zoom' }
                  ]
              }

      ];

      Menu.setApplicationMenu(
        Menu.buildFromTemplate(template)
      );


  win.loadFile('index.html');
}








async function requestTranslation(
  word,
  targetLanguage
) {

  const url =
    'https://translate.googleapis.com/translate_a/single' +
    '?client=gtx' +
    '&sl=auto' +
    `&tl=${targetLanguage}` +
    '&dt=t' +
    `&q=${encodeURIComponent(word)}`;


  const response =
    await net.fetch(
      url
    );


  if (!response.ok) {

    throw new Error(
      `Translation failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  const translation =
    data[0]
      ?.map(
        part =>
          part[0]
      )
      .join('') ||
    word;


  const detectedLanguage =
    data[2] ||
    'unknown';


  return {
    translation,
    detectedLanguage
  };

}


ipcMain.handle(
  'translate-word',

  async (
    event,
    word
  ) => {

    if (
      typeof word !== 'string' ||
      !word.trim()
    ) {

      return null;

    }


    const cleanWord =
      word
        .trim()
        .slice(
          0,
          100
        );


    /*
     * First translate toward English.
     * This also gives us detected language.
     */

    const englishResult =
      await requestTranslation(
        cleanWord,
        'en'
      );


    const sourceLanguage =
      englishResult
        .detectedLanguage
        .toLowerCase();


    /*
     * English → French
     */

    if (
      sourceLanguage === 'en' ||
      sourceLanguage.startsWith(
        'en-'
      )
    ) {

      const frenchResult =
        await requestTranslation(
          cleanWord,
          'fr'
        );


      return {

        original:
          cleanWord,

        translation:
          frenchResult.translation,

        sourceLanguage:
          'en',

        targetLanguage:
          'fr'

      };

    }


    /*
     * Everything else → English
     */

    return {

      original:
        cleanWord,

      translation:
        englishResult.translation,

      sourceLanguage,

      targetLanguage:
        'en'

    };

  }
);

/* --------------------------------
   READY
-------------------------------- */

app.whenReady().then(async () => {

  /*
   * Handles:
   *
   * orangesoft://newtab/
   * orangesoft://newtab/styles/...
   * orangesoft://newtab/assets/...
   */

  protocol.handle(
    'orangesoft',

    async request => {

      const url =
        new URL(request.url);


      if (url.hostname !== 'newtab') {

        return new Response(
          'Not found',
          {
            status: 404
          }
        );

      }


      let relativePath =
        decodeURIComponent(
          url.pathname
        )
        .replace(/^\/+/, '');


      /*
       * orangesoft://newtab/
       */

      if (!relativePath) {

        relativePath =
          'newtab.html';

      }


      /*
       * Prevent invalid paths.
       */

      if (
        relativePath.includes('..')
      ) {

        return new Response(
          'Not found',
          {
            status: 404
          }
        );

      }


      /*
       * Only allow New Tab resources.
       */

      const allowed =
        relativePath ===
          'newtab.html' ||

        relativePath.startsWith(
          'styles/'
        ) ||

        relativePath.startsWith(
          'assets/'
        );


      if (!allowed) {

        return new Response(
          'Not found',
          {
            status: 404
          }
        );

      }


      const filePath =
        path.join(
          __dirname,
          relativePath
        );


      return net.fetch(
        pathToFileURL(
          filePath
        ).toString()
      );

    }
  );


  createWindow();

});


/* --------------------------------
   MAC APP EVENTS
-------------------------------- */

app.on(
  'window-all-closed',
  () => {

    if (
      process.platform !==
      'darwin'
    ) {

      app.quit();

    }

  }
);


app.on(
  'activate',
  () => {

    if (
      BrowserWindow
        .getAllWindows()
        .length === 0
    ) {

      createWindow();

    }

  }
);