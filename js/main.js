import {
  HOME_URL
} from './config.js';

import {
  createTab
} from './tabs.js';

import {
  setupEvents
} from './events.js';

import {
  setupFavoritesPopup
} from './favorites-popup.js';


setupFavoritesPopup();

setupEvents();

createTab(
  HOME_URL
);