import {
  currentTab,
  closeTab,
  getActiveTabId
} from '../tabs.js';

import {
  openNewTab
} from './new-tab-events.js';


export function setupKeyboardEvents() {

  const address =
    document.getElementById(
      'address'
    );


  window.addEventListener(
    'keydown',
    event => {

      const cmd =
        event.metaKey ||
        event.ctrlKey;


      if (!cmd) {
        return;
      }


      const key =
        event.key.toLowerCase();


      /*
       * CMD + L
       */

      if (key === 'l') {

        event.preventDefault();

        address.focus();

        address.select();

        return;

      }


      /*
       * CMD + T
       */

      if (key === 't') {

        event.preventDefault();

        openNewTab();

        return;

      }


      /*
       * CMD + W
       */

      if (key === 'w') {

        event.preventDefault();


        const id =
          getActiveTabId();


        if (
          id !== null
        ) {

          closeTab(
            id
          );

        }

        return;

      }


      /*
       * CMD + R
       */

      if (key === 'r') {

        event.preventDefault();


        const tab =
          currentTab();


        if (tab) {

          tab.webview.reload();

        }

      }

    }
  );

}