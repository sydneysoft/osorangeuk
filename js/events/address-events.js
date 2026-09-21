import {
  parseInput
} from '../urls.js';

import {
  rememberActivity
} from '../history.js';

import {
  currentTab,
  navigateTab
} from '../tabs.js';

import {
  renderSuggestions,
  hideSuggestions,
  moveSuggestionSelection,
  activateSelectedSuggestion
} from '../suggestions.js';

import {
  openFavoritesPopup,
  closeFavoritesPopup
} from '../favorites-popup.js';


export function setupAddressEvents() {

  const address =
    document.getElementById(
      'address'
    );


  /*
   * FOCUS
   */

  address.addEventListener(
    'focus',
    () => {

      openFavoritesPopup();

      renderSuggestions('');

    }
  );


  /*
   * INPUT
   */

  address.addEventListener(
    'input',
    () => {

      const value =
        address.value.trim();


      if (!value) {

        hideSuggestions();

        openFavoritesPopup();

        return;

      }


      closeFavoritesPopup();

      renderSuggestions(
        value
      );

    }
  );


  /*
   * BLUR
   */

  address.addEventListener(
    'blur',
    () => {

      setTimeout(
        () => {

          hideSuggestions();

        },
        150
      );

    }
  );


  /*
   * KEYBOARD
   */

  address.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        'ArrowDown'
      ) {

        event.preventDefault();

        moveSuggestionSelection(
          1
        );

        return;

      }


      if (
        event.key ===
        'ArrowUp'
      ) {

        event.preventDefault();

        moveSuggestionSelection(
          -1
        );

        return;

      }


      if (
        event.key ===
        'Escape'
      ) {

        hideSuggestions();

        closeFavoritesPopup();

        address.blur();

        return;

      }


      if (
        event.key !== 'Enter'
      ) {

        return;

      }


      if (
        activateSelectedSuggestion()
      ) {

        closeFavoritesPopup();

        return;

      }


      const rawValue =
        address.value.trim();


      const target =
        parseInput(
          rawValue
        );


      if (!target) {
        return;
      }


      const isDirectURL =
        rawValue.startsWith(
          'http://'
        ) ||

        rawValue.startsWith(
          'https://'
        ) ||

        rawValue.startsWith(
          'orangesoft://'
        ) ||

        (
          rawValue.includes('.') &&
          !rawValue.includes(' ')
        );


      if (!isDirectURL) {

        rememberActivity({
          type: 'search',
          title: rawValue,
          query: rawValue,
          url: target
        });

      }


      hideSuggestions();

      closeFavoritesPopup();


      const tab =
        currentTab();


      if (tab) {

        navigateTab(
          tab,
          target
        );

      }

    }
  );

}