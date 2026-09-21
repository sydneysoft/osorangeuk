import {
  getFavorites,
  removeFavorite
} from './favorites.js';

import {
  currentTab
} from './tabs.js';


let popup;
let grid;


function renderFavorites() {

  const favorites =
    getFavorites();

  grid.innerHTML = '';


  if (favorites.length === 0) {

    const empty =
      document.createElement('div');

    empty.className =
      'favorites-empty';

    empty.textContent =
      'No favorites yet';

    grid.appendChild(empty);

    return;
  }


  favorites.forEach(
    favorite => {

      const item =
        document.createElement('div');

      item.className =
        'favorite-item';


      const icon =
        document.createElement('div');

      icon.className =
        'favorite-icon';


      if (favorite.icon) {

        const img =
          document.createElement('img');

        img.src =
          favorite.icon;

        img.alt = '';

        icon.appendChild(img);

      } else {

        icon.textContent =
          (
            favorite.title ||
            favorite.url
          )
            .charAt(0)
            .toUpperCase();

      }


      const title =
        document.createElement('div');

      title.className =
        'favorite-title';

      title.textContent =
        favorite.title ||
        favorite.url;


      const removeButton =
        document.createElement('button');

      removeButton.className =
        'favorite-remove';

      removeButton.textContent =
        '×';


      removeButton.addEventListener(
        'click',
        event => {

          event.stopPropagation();

          removeFavorite(
            favorite.url
          );

          renderFavorites();

        }
      );


      item.appendChild(
        removeButton
      );

      item.appendChild(
        icon
      );

      item.appendChild(
        title
      );


      item.addEventListener(
        'click',
        () => {

          const tab =
            currentTab();

          if (tab) {

            tab.webview.loadURL(
              favorite.url
            );

          }

          closeFavoritesPopup();

        }
      );


      grid.appendChild(
        item
      );

    }
  );

}


export function openFavoritesPopup() {

  if (!popup || !grid) {
    return;
  }

  renderFavorites();

  popup.classList.add(
    'visible'
  );

}


export function closeFavoritesPopup() {

  if (!popup) {
    return;
  }

  popup.classList.remove(
    'visible'
  );

}


export function setupFavoritesPopup() {

  popup =
    document.getElementById(
      'favorites-popup'
    );

  grid =
    document.getElementById(
      'favorites-grid'
    );

  const closeButton =
    document.getElementById(
      'close-favorites'
    );


  closeButton.addEventListener(
    'click',
    () => {

      closeFavoritesPopup();

    }
  );


  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Escape'
      ) {

        closeFavoritesPopup();

      }

    }
  );

}