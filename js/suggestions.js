import {
  state
} from './state.js';

import {
  getHistory,
  rememberActivity
} from './history.js';

import {
  currentTab
} from './tabs.js';


export const knownSites = [
  {
    title: 'StoryLingo',
    url: 'https://storylingo.uk'
  },
  {
    title: 'OrangeSoft',
    url: 'https://orangesoft.uk'
  },
  {
    title: 'Google',
    url: 'https://google.com'
  },
  {
    title: 'YouTube',
    url: 'https://youtube.com'
  },
  {
    title: 'Scribd',
    url: 'https://scribd.com'
  }
];


const suggestions =
  document.getElementById(
    'suggestions'
  );


export function getSuggestions(value) {

  const query =
    value.trim().toLowerCase();


  // Clicking the address bar with
  // no search text shows recent history.
if (!query) {

  const recent =
    getHistory().slice(0, 5);

  const seen =
    new Set(
      recent.map(
        item => item.url
      )
    );

  const defaults =
    knownSites
      .filter(
        site =>
          !seen.has(site.url)
      )
      .slice(
        0,
        8 - recent.length
      );

  return [
    ...recent,
    ...defaults
  ];
}


  const allSites = [
    ...getHistory(),
    ...knownSites
  ];


  const unique = [];

  const seen = new Set();


  for (const site of allSites) {

    if (!site.url)
      continue;


    if (seen.has(site.url))
      continue;


    const title =
      (site.title || '')
        .toLowerCase();


    const url =
      site.url
        .toLowerCase();


    const savedQuery =
      (site.query || '')
        .toLowerCase();


    if (
      title.includes(query) ||
      url.includes(query) ||
      savedQuery.includes(query)
    ) {

      unique.push(site);

      seen.add(site.url);

    }

  }


  unique.push({
    type: 'search',

    title:
      `Search for "${value}"`,

    query: value,

    url:
      'https://www.google.com/search?q=' +
      encodeURIComponent(value)
  });


  return unique.slice(
    0,
    8
  );
}


export function renderSuggestions(
  value
) {

  const results =
    getSuggestions(value);


  suggestions.innerHTML = '';

  state.selectedSuggestion = -1;


  if (!results.length) {

    hideSuggestions();

    return;

  }


  results.forEach(
    (result, index) => {

      const row =
        document.createElement(
          'div'
        );


      row.className =
        'suggestion';

      row.dataset.index =
        index;

      row.dataset.url =
        result.url;


      /*
       * History / clock icon
       */

      const icon =
        document.createElement(
          'span'
        );

      icon.className =
        'suggestion-icon';


      if (
        result.type === 'history' ||
        result.type === 'search'
      ) {

        // Font-style history/clock glyph
        icon.textContent = '◷';

      } else {

        icon.textContent = '↗';

      }


      /*
       * Title
       */

      const title =
        document.createElement(
          'span'
        );

      title.className =
        'suggestion-title';

      title.textContent =
        result.title;


      /*
       * URL
       */

      const url =
        document.createElement(
          'span'
        );

      url.className =
        'suggestion-url';

      url.textContent =
        result.url;


      row.appendChild(icon);
      row.appendChild(title);
      row.appendChild(url);


      row.addEventListener(
        'mousedown',
        event => {

          event.preventDefault();


          if (
            result.type ===
            'search'
          ) {

            rememberActivity({
              type: 'search',
              title:
                result.query,
              query:
                result.query,
              url:
                result.url
            });

          }


          const tab =
            currentTab();


          if (tab) {

            tab.webview.loadURL(
              result.url
            );

          }


          hideSuggestions();

        }
      );


      suggestions.appendChild(
        row
      );

    }
  );


  suggestions.classList.add(
    'visible'
  );
}


export function hideSuggestions() {

  suggestions.classList.remove(
    'visible'
  );

  state.selectedSuggestion = -1;

}


export function moveSuggestionSelection(
  direction
) {

  const rows =
    Array.from(
      suggestions.querySelectorAll(
        '.suggestion'
      )
    );


  if (!rows.length)
    return;


  state.selectedSuggestion +=
    direction;


  if (
    state.selectedSuggestion < 0
  ) {

    state.selectedSuggestion =
      rows.length - 1;

  }


  if (
    state.selectedSuggestion >=
    rows.length
  ) {

    state.selectedSuggestion = 0;

  }


  rows.forEach(
    (row, index) => {

      row.classList.toggle(
        'selected',

        index ===
        state.selectedSuggestion
      );

    }
  );
}


export function activateSelectedSuggestion() {

  if (
    state.selectedSuggestion < 0
  ) {

    return false;

  }


  const rows =
    suggestions.querySelectorAll(
      '.suggestion'
    );


  const selected =
    rows[
      state.selectedSuggestion
    ];


  if (!selected)
    return false;


  selected.dispatchEvent(
    new MouseEvent(
      'mousedown',
      {
        bubbles: true
      }
    )
  );


  return true;
}