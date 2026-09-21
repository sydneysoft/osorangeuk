import {
  setupNavigationEvents
} from './events/navigation-events.js';

import {
  setupAddressEvents
} from './events/address-events.js';

import {
  setupNewTabEvents
} from './events/new-tab-events.js';

import {
  setupFavoriteEvents
} from './events/favorite-events.js';

import {
  setupKeyboardEvents
} from './events/keyboard-events.js';


export function setupEvents() {

  setupNavigationEvents();

  setupAddressEvents();

  setupNewTabEvents();

  setupFavoriteEvents();

  setupKeyboardEvents();

}