const STORAGE_KEY =
  'orangesoft-favorites';


let favorites = [];


/*
 * LOAD FAVORITES
 */

try {

  favorites =
    JSON.parse(
      localStorage.getItem(
        STORAGE_KEY
      )
    ) || [];

} catch {

  favorites = [];

}


/*
 * SAVE FAVORITES
 */

function saveFavorites() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      favorites
    )
  );

}


/*
 * GET ALL FAVORITES
 */

export function getFavorites() {

  return favorites;

}


/*
 * CHECK IF URL IS FAVORITE
 */

export function isFavorite(
  url
) {

  return favorites.some(
    favorite =>
      favorite.url === url
  );

}


/*
 * ADD FAVORITE
 */

export function addFavorite(
  item
) {

  if (
    !item ||
    !item.url
  ) {
    return;
  }


  if (
    isFavorite(
      item.url
    )
  ) {
    return;
  }


  favorites.unshift({
    type: 'favorite',

    title:
      item.title ||
      item.url,

    url:
      item.url
  });


  saveFavorites();

}


/*
 * REMOVE FAVORITE
 */

export function removeFavorite(
  url
) {

  favorites =
    favorites.filter(
      favorite =>
        favorite.url !== url
    );


  saveFavorites();

}


/*
 * TOGGLE FAVORITE
 */

export function toggleFavorite(
  item
) {

  if (
    !item ||
    !item.url
  ) {
    return false;
  }


  if (
    isFavorite(
      item.url
    )
  ) {

    removeFavorite(
      item.url
    );

    return false;

  }


  addFavorite(
    item
  );

  return true;

}