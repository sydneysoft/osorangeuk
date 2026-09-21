import {
  MAX_HISTORY_ITEMS
} from './config.js';


let browsingHistory = [];


try {

  browsingHistory =
    JSON.parse(
      localStorage.getItem(
        'orangesoft-history'
      )
    ) || [];

} catch {

  browsingHistory = [];

}


export function getHistory() {
  return browsingHistory;
}


export function saveHistory() {

  localStorage.setItem(
    'orangesoft-history',
    JSON.stringify(
      browsingHistory.slice(
        0,
        MAX_HISTORY_ITEMS
      )
    )
  );

}


export function rememberActivity(item) {

  const key =
    item.type === 'search'
      ? `search:${item.query.toLowerCase()}`
      : item.url;


  const existingIndex =
    browsingHistory.findIndex(
      existing => {

        const existingKey =
          existing.type === 'search'
            ? `search:${(
                existing.query || ''
              ).toLowerCase()}`
            : existing.url;

        return existingKey === key;

      }
    );


  if (existingIndex !== -1) {
    browsingHistory.splice(
      existingIndex,
      1
    );
  }


  browsingHistory.unshift(item);


  if (
    browsingHistory.length >
    MAX_HISTORY_ITEMS
  ) {
    browsingHistory.length =
      MAX_HISTORY_ITEMS;
  }


  saveHistory();
}