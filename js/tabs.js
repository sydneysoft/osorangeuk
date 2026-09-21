import {
  NEW_TAB_URL
} from './config.js';

import {
  state
} from './state.js';

import {
  displayURL
} from './urls.js';

import {
  rememberActivity
} from './history.js';


const tabsElement =
  document.getElementById(
    'tabs'
  );

const newTabButton =
  document.getElementById(
    'new-tab-button'
  );

const browserContainer =
  document.getElementById(
    'browser-container'
  );

const address =
  document.getElementById(
    'address'
  );


/*
 * CURRENT TAB
 */

export function currentTab() {

  return state.tabs.find(
    tab =>
      tab.id ===
      state.activeTabId
  );

}


export function getActiveTabId() {

  return state.activeTabId;

}


/*
 * CREATE TAB UI
 */

function createTabUI(
  id
) {

  const button =
    document.createElement(
      'div'
    );

  button.className =
    'tab';

  button.dataset.id =
    id;


  const favicon =
    document.createElement(
      'img'
    );

  favicon.className =
    'tab-icon';

  favicon.src =
    'assets/orangesoft-icon.png';


  const title =
    document.createElement(
      'div'
    );

  title.className =
    'tab-title';

  title.textContent =
    'New Tab';


  const closeButton =
    document.createElement(
      'div'
    );

  closeButton.className =
    'close-tab';

  closeButton.textContent =
    '×';


  button.append(
    favicon,
    title,
    closeButton
  );


  tabsElement.insertBefore(
    button,
    newTabButton
  );


  return {
    button,
    favicon,
    title,
    closeButton
  };

}


/*
 * CREATE WEBVIEW
 */

function createWebview(
  url
) {

  const webview =
    document.createElement(
      'webview'
    );


  webview.setAttribute(
    'allowpopups',
    ''
  );
const preloadURL =
  new URL(
    'webview-preload.js',
    window.location.href
  ).toString();


webview.setAttribute(
  'preload',
  preloadURL
);

  webview.setAttribute(
    'tabindex',
    '-1'
  );


  /*
   * A fresh New Tab stays empty.
   *
   * No website is loaded until
   * the user navigates somewhere.
   */

  if (
    url !== NEW_TAB_URL
  ) {

    webview.src =
      url;

  }


  browserContainer.appendChild(
    webview
  );


  return webview;

}


/*
 * CREATE TAB OBJECT
 */

function createTabObject(
  id,
  url,
  ui,
  webview
) {

  return {

    id,

    button:
      ui.button,

    title:
      ui.title,

    favicon:
      ui.favicon,

    closeButton:
      ui.closeButton,

    webview,

    initialURL:
      url,

    currentURL:
      url === NEW_TAB_URL
        ? ''
        : url,

    isNewTab:
      url === NEW_TAB_URL

  };

}


/*
 * NAVIGATE TAB
 */

export function navigateTab(
  tab,
  url
) {

  if (
    !tab ||
    !url
  ) {

    return;

  }


  tab.currentURL =
    url;

  tab.isNewTab =
    false;


  tab.webview.src =
    url;


  if (
    state.activeTabId ===
    tab.id
  ) {

    syncAddressBar(
      tab
    );

  }

}


/*
 * TAB BUTTON EVENTS
 */

function bindTabEvents(
  tab
) {

  tab.button.addEventListener(
    'click',
    event => {

      if (
        event.target ===
        tab.closeButton
      ) {

        event.stopPropagation();

        closeTab(
          tab.id
        );

        return;

      }


      activateTab(
        tab.id
      );

    }
  );

}


/*
 * NAVIGATION EVENTS
 */

function bindNavigationEvents(
  tab
) {

  tab.webview.addEventListener(
    'did-navigate',
    event => {

      updateAddressBar(
        tab,
        event.url
      );

    }
  );


  tab.webview.addEventListener(
    'did-navigate-in-page',
    event => {

      updateAddressBar(
        tab,
        event.url
      );

    }
  );

}


/*
 * PAGE INFO EVENTS
 */

function bindPageInfoEvents(
  tab
) {

  tab.webview.addEventListener(
    'page-title-updated',
    event => {

      tab.title.textContent =
        event.title ||
        'New Tab';


      const url =
        tab.webview.getURL();


      saveHistory(
        tab,
        url
      );

    }
  );


  tab.webview.addEventListener(
    'page-favicon-updated',
    event => {

      if (
        event.favicons?.length
      ) {

        tab.favicon.src =
          event.favicons[0];

      }

    }
  );

}


/*
 * WEBVIEW EVENTS
 */

function bindWebviewEvents(
  tab
) {

  bindNavigationEvents(
    tab
  );

  bindPageInfoEvents(
    tab
  );

}


/*
 * ADDRESS BAR
 */

function syncAddressBar(
  tab
) {

  if (!tab) {

    return;

  }


  /*
   * Fresh New Tab:
   * address MUST be empty.
   */

  if (
    tab.isNewTab
  ) {

    address.value =
      '';

    return;

  }


  address.value =
    displayURL(
      tab.currentURL ||
      tab.webview.getURL()
    );

}


function updateAddressBar(
  tab,
  url
) {

  /*
   * Ignore about:blank generated
   * by an empty New Tab.
   */

  if (
    tab.isNewTab &&
    (
      !url ||
      url === 'about:blank' ||
      url.startsWith(
        'orangesoft://newtab'
      )
    )
  ) {

    if (
      state.activeTabId ===
      tab.id
    ) {

      address.value =
        '';

    }

    return;

  }


  tab.currentURL =
    url;


  if (
    url &&
    url !== 'about:blank' &&
    !url.startsWith(
      'orangesoft://newtab'
    )
  ) {

    tab.isNewTab =
      false;

  }


  if (
    state.activeTabId !==
    tab.id
  ) {

    return;

  }


  syncAddressBar(
    tab
  );

}


/*
 * HISTORY
 */

function saveHistory(
  tab,
  url
) {

  if (!url) {

    return;

  }


  if (
    !url.startsWith(
      'http://'
    ) &&
    !url.startsWith(
      'https://'
    )
  ) {

    return;

  }


  rememberActivity({

    type:
      'history',

    title:
      tab.title.textContent ||
      url,

    url

  });

}


/*
 * CREATE TAB
 */

export function createTab(
  url = NEW_TAB_URL
) {

  const id =
    ++state.tabCounter;


  const ui =
    createTabUI(
      id
    );


  const webview =
    createWebview(
      url
    );


  const tab =
    createTabObject(
      id,
      url,
      ui,
      webview
    );


  state.tabs.push(
    tab
  );


  bindTabEvents(
    tab
  );


  bindWebviewEvents(
    tab
  );


  activateTab(
    id
  );


  return tab;

}


/*
 * ACTIVATE TAB
 */

export function activateTab(
  id
) {

  state.activeTabId =
    id;


  state.tabs.forEach(
    tab => {

      const active =
        tab.id === id;


      tab.button.classList.toggle(
        'active',
        active
      );


      tab.webview.classList.toggle(
        'active',
        active
      );

    }
  );


  const tab =
    currentTab();


  if (!tab) {

    return;

  }


  syncAddressBar(
    tab
  );

}


/*
 * CLOSE TAB
 */

export function closeTab(
  id
) {

  const index =
    state.tabs.findIndex(
      tab =>
        tab.id === id
    );


  if (
    index === -1
  ) {

    return;

  }


  const wasActive =
    state.activeTabId === id;


  const tab =
    state.tabs[index];


  tab.button.remove();

  tab.webview.remove();


  state.tabs.splice(
    index,
    1
  );


  /*
   * Last tab closed:
   * create a fresh empty tab.
   */

  if (
    state.tabs.length === 0
  ) {

    createTab();

    return;

  }


  /*
   * If we closed the active tab,
   * activate a nearby existing tab.
   */

  if (
    wasActive
  ) {

    const nextIndex =
      Math.min(
        index,
        state.tabs.length - 1
      );


    const nextTab =
      state.tabs[
        nextIndex
      ];


    activateTab(
      nextTab.id
    );

  }

}