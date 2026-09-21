import {
  HOME_URL
} from '../config.js';

import {
  currentTab
} from '../tabs.js';


export function setupNavigationEvents() {

  const backButton =
    document.getElementById(
      'back'
    );

  const forwardButton =
    document.getElementById(
      'forward'
    );

  const reloadButton =
    document.getElementById(
      'reload'
    );

  const homeButton =
    document.getElementById(
      'home'
    );


  backButton.addEventListener(
    'click',
    () => {

      const tab =
        currentTab();

      if (
        tab &&
        tab.webview.canGoBack()
      ) {

        tab.webview.goBack();

      }

    }
  );


  forwardButton.addEventListener(
    'click',
    () => {

      const tab =
        currentTab();

      if (
        tab &&
        tab.webview.canGoForward()
      ) {

        tab.webview.goForward();

      }

    }
  );


  reloadButton.addEventListener(
    'click',
    () => {

      const tab =
        currentTab();

      if (tab) {

        tab.webview.reload();

      }

    }
  );


  homeButton.addEventListener(
    'click',
    () => {

      const tab =
        currentTab();

      if (tab) {

        tab.webview.loadURL(
          HOME_URL
        );

      }

    }
  );

}