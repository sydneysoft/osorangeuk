import {
  createTab
} from '../tabs.js';

import {
  openFavoritesPopup
} from '../favorites-popup.js';

import {
  renderSuggestions
} from '../suggestions.js';


export function openNewTab() {

  createTab();

  const address =
    document.getElementById(
      'address'
    );


  address.value = '';

  address.focus();

  address.setSelectionRange(
    0,
    0
  );


  openFavoritesPopup();

  renderSuggestions('');

}


export function setupNewTabEvents() {

  const button =
    document.getElementById(
      'new-tab-button'
    );


  /*
   * Don't allow the + button itself
   * to become the keyboard focus.
   */

  button.addEventListener(
    'mousedown',
    event => {

      event.preventDefault();

    }
  );


  button.addEventListener(
    'click',
    () => {

      openNewTab();

    }
  );

}