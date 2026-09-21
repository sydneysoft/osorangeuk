import {
  toggleFavorite
} from '../favorites.js';

import {
  currentTab
} from '../tabs.js';


export function setupFavoriteEvents() {

  const favoriteButton =
    document.getElementById(
      'favorite'
    );


  if (!favoriteButton) {
    return;
  }


  favoriteButton.addEventListener(
    'click',
    () => {

      const tab =
        currentTab();


      if (!tab) {
        return;
      }


      const url =
        tab.webview.getURL();


      if (
        !url ||
        url.startsWith(
          'orangesoft://newtab'
        )
      ) {

        return;

      }


      const title =
        tab.webview.getTitle?.() ||
        tab.title?.textContent ||
        url;


      const added =
        toggleFavorite({
          title,
          url,
          icon:
            tab.favicon?.src ||
            ''
        });


      favoriteButton.textContent =
        added
          ? '★'
          : '☆';


      favoriteButton.title =
        added
          ? 'Remove from Favorites'
          : 'Add to Favorites';

    }
  );

}